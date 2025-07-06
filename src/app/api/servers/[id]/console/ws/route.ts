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
  
  handleConsoleConnection(ws, serverId as string, request);
}

async function handleConsoleConnection(ws: WebSocket, serverId: string, request: import('http').IncomingMessage) {
  try {
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) {
      ws.close(1001, 'no authentication cookies');
      return;
    }
    const sessionToken = cookieHeader.split(';')
      .find(c => c.trim().startsWith('__Secure-authjs.session-token='))
      ?.split('=')[1];
    
    if (!sessionToken) {
      console.log("no session token");
      ws.close(1001, 'no session token');
      return;
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true }
    });
    
    if (!session || !session.user) {
      console.log("invalid session");
      ws.close(1001, 'invalid session');
      return;
    }

    const dbServer = await prisma.server.findUnique({ where: { id: serverId } });
    if (!dbServer) {
      console.log("server not found");
      ws.close(1000, 'server not found');
      return;
    }

    if (dbServer.userId !== session.user.id) {
      ws.close(1003, 'server not owned by user');
      return;
    }

    const pterodactylId = dbServer.pterodactylServerId;

    const panelUrl = process.env.PTERODACTYL_PANEL_URL;
    const apiKey = process.env.PTERODACTYL_CLIENT_API_KEY;

    const response = await fetch(`${panelUrl}/api/client/servers/${pterodactylId}/websocket`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error('failed to get websocket url from pterodactyl');
    }

    const data = (await response.json() as any).data as PteroWSData;
    const pteroWs = new WebSocket(data.socket, { headers: { origin: panelUrl } });

    pteroWs.on("open", () => {
      pteroWs.send(JSON.stringify({ event: "auth", args: [data.token] }));
    });

    pteroWs.on("message", (raw: WebSocket.Data) => {
      try {
        const msg = JSON.parse(raw.toString());
        
        if (msg.event === "auth success") {
          pteroWs.send(JSON.stringify({ event: "send logs", args: [null] }));
          pteroWs.send(JSON.stringify({ event: "send stats", args: [null] }));
        }
        
        if (msg.event === "console output") {
          let consoleOutput = msg.args[0];
          if (consoleOutput) {
            const hostRegex = /container@pterodactyl/g;
            consoleOutput = consoleOutput.replace(hostRegex, `${session.user.name}@freehost`);
            const ipRegex = /(\d{1,3}\.){3}\d{1,3}/g;
            const ipMatch = consoleOutput.match(ipRegex);
            if (ipMatch) {
              const ip = ipMatch[0];
              if (ip !== '127.0.0.1' && ip !== '0.0.0.0') {
                consoleOutput = consoleOutput.replace(ip, 'x.x.x.x');
              }
            }
          }
          ws.send(JSON.stringify({ type: 'console', data: consoleOutput }));
        }

        if (msg.event === "stats") {
          const stats = msg.args[0];
          if (stats) {
            ws.send(JSON.stringify({ type: 'stats', data: stats }));
          }
        }
      } catch (error) {
        console.error("error parsing pterodactyl message:", error);
      }
    });

    pteroWs.on("error", (error: Error) => {
      console.error("pterodactyl websocket error:", error);
      ws.send(JSON.stringify({ type: 'error', data: 'connection error' }));
    });

    pteroWs.on("close", () => {
      ws.send(JSON.stringify({ type: 'disconnect', data: 'connection closed' }));
    });

    ws.on("message", (raw: WebSocket.Data) => {
      try {
        const message = JSON.parse(raw.toString());
        if (message.type === 'command') {
          pteroWs.send(JSON.stringify({ event: "send command", args: [message.data] }));
        }
      } catch (error) {
        console.error("error parsing client message:", error);
      }
    });

    ws.on("close", () => {
      pteroWs.close();
    });

    ws.on("error", (error: Error) => {
      console.error("client websocket error:", error);
      pteroWs.close();
    });

  } catch (error) {
    console.error("error setting up websocket proxy:", error);
    ws.close(1011, 'Internal server error');
  }
} 