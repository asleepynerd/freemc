export const runtime = "nodejs";

import { WebSocket } from 'ws';
import fetch from 'node-fetch';
import { client, app } from '@/lib/pterodactyl';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface PteroWSData { 
  socket: string; 
  token: string; 
}


export async function GET() {
  return new Response('WebSocket endpoint', { status: 200 });
}

export function SOCKET(
  ws: WebSocket,
  request: import('http').IncomingMessage,
  server: import('ws').WebSocketServer,
  context: { params: Record<string, string | string[]> }
) {
  const serverId = context.params.id;
  
  if (!serverId || typeof serverId !== 'string' || serverId.length < 1) {
    ws.close(1008, 'invalid server id');
    return;
  }
  
  handleConsoleConnection(ws, serverId as string, request);
}

async function handleConsoleConnection(ws: WebSocket, serverId: string, request: import('http').IncomingMessage) {
  let pteroWs: WebSocket | null = null;
  
  try {
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) {
      ws.close(1001, 'no authentication cookies');
      return;
    }
    
    const sessionToken = cookieHeader
      .split(';')
      .map(c => c.trim())
      .find(c => c.startsWith('__Secure-authjs.session-token='))
      ?.split('=')[1];
    
    if (!sessionToken) {
      console.log("no session token found in cookies");
      ws.close(1001, 'no session token');
      return;
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true }
    });
    
    if (!session || !session.user) {
      console.log("invalid session token");
      ws.close(1001, 'invalid session');
      return;
    }

    if (session.expires < new Date()) {
      console.log("session expired");
      ws.close(1001, 'session expired');
      return;
    }

    const dbServer = await prisma.server.findUnique({ where: { id: serverId } });
    if (!dbServer) {
      console.log("server not found:", serverId);
      ws.close(1000, 'server not found');
      return;
    }

    if (dbServer.userId !== session.user.id) {
      console.log("server not owned by user:", serverId, session.user.id);
      ws.close(1003, 'server not owned by user');
      return;
    }

    const pterodactylId = dbServer.pterodactylServerId;

    const panelUrl = process.env.PTERODACTYL_PANEL_URL;
    const apiKey = process.env.PTERODACTYL_CLIENT_API_KEY;

    if (!panelUrl || !apiKey) {
      console.error("missing pterodactyl configuration");
      ws.close(1011, 'server configuration error');
      return;
    }

    const response = await fetch(`${panelUrl}/api/client/servers/${pterodactylId}/websocket`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("failed to get websocket url from pterodactyl:", response.status);
      throw new Error('failed to get websocket url from pterodactyl');
    }

    const data = (await response.json() as any).data as PteroWSData;
    pteroWs = new WebSocket(data.socket, { headers: { origin: panelUrl } });

    const connectionTimeout = setTimeout(() => {
      if (pteroWs && pteroWs.readyState === WebSocket.CONNECTING) {
        console.error("pterodactyl websocket connection timeout");
        pteroWs.close();
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1011, 'connection timeout');
        }
      }
    }, 10000);

    pteroWs.on("open", () => {
      clearTimeout(connectionTimeout);
      console.log("pterodactyl websocket connected");
      pteroWs!.send(JSON.stringify({ event: "auth", args: [data.token] }));
    });

    pteroWs.on("message", (raw: WebSocket.Data) => {
      try {
        const msg = JSON.parse(raw.toString());
        
        if (msg.event === "auth success") {
          console.log("pterodactyl authentication successful");
          pteroWs!.send(JSON.stringify({ event: "send logs", args: [null] }));
          pteroWs!.send(JSON.stringify({ event: "send stats", args: [null] }));
        }
        
        if (msg.event === "console output") {
          let consoleOutput = msg.args[0];
          if (consoleOutput) {
            const hostRegex = /container@pterodactyl/g;
            consoleOutput = consoleOutput.replace(hostRegex, `${session.user.name}@freehost`);
            const ipRegex = /(\d{1,3}\.){3}\d{1,3}/g;
            const ipMatch = consoleOutput.match(ipRegex);
            const pdaemonRegex = /Pterodactyl Daemon/gi;
            consoleOutput = consoleOutput.replace(pdaemonRegex, 'freehost daemon');
            if (ipMatch) {
              const ip = ipMatch[0];
              if (ip !== '127.0.0.1' && ip !== '0.0.0.0') {
                consoleOutput = consoleOutput.replace(ip, 'x.x.x.x');
              }
            }
          }
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'console', data: consoleOutput }));
          }
        }

        if (msg.event === "stats") {
          const stats = msg.args[0];
          if (stats && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'stats', data: stats }));
          }
        }
      } catch (error) {
        console.error("error parsing pterodactyl message:", error);
      }
    });

    pteroWs.on("error", (error: Error) => {
      clearTimeout(connectionTimeout);
      console.error("pterodactyl websocket error:", error);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'error', data: 'connection error' }));
      }
    });

    pteroWs.on("close", (code, reason) => {
      clearTimeout(connectionTimeout);
      console.log("pterodactyl websocket closed", code, reason?.toString());
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'disconnect', data: 'connection closed' }));
      }
    });

    ws.on("message", (raw: WebSocket.Data) => {
      try {
        const message = JSON.parse(raw.toString());
        if (message.type === 'command') {
          if (typeof message.data !== 'string' || message.data.length > 1000) {
            console.warn("invalid command received:", message.data);
            return;
          }
          if (pteroWs && pteroWs.readyState === WebSocket.OPEN) {
            pteroWs.send(JSON.stringify({ event: "send command", args: [message.data] }));
          }
        } else if (message.type === 'ping') {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        }
      } catch (error) {
        console.error("error parsing client message:", error);
      }
    });

    ws.on("close", (code, reason) => {
      clearTimeout(connectionTimeout);
      console.log("client websocket closed", code, reason?.toString());
      if (pteroWs && pteroWs.readyState === WebSocket.OPEN) {
        pteroWs.close();
      }
    });

    ws.on("error", (error: Error) => {
      clearTimeout(connectionTimeout);
      console.error("client websocket error:", error);
      if (pteroWs && pteroWs.readyState === WebSocket.OPEN) {
        pteroWs.close();
      }
    });

  } catch (error) {
    console.error("error setting up websocket proxy:", error);
    if (pteroWs && pteroWs.readyState === WebSocket.OPEN) {
      pteroWs.close();
    }
    if (ws.readyState === WebSocket.OPEN) {
      ws.close(1011, 'Internal server error');
    }
  }
} 