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

const activeConnections = new Map<string, WebSocket>();

export async function GET() {
  return new Response('websocket endpoint', { status: 200 });
}

export function SOCKET(
  ws: WebSocket,
  request: import('http').IncomingMessage,
  server: import('ws').WebSocketServer,
  context: { params: Record<string, string | string[]> }
) {
  console.log("websocket connection attempt received");
  const serverId = context.params.id;
  
  if (!serverId || typeof serverId !== 'string' || serverId.length < 1) {
    console.log("invalid server id:", serverId);
    ws.close(1008, 'invalid server id');
    return;
  }
  
  const existingConnection = activeConnections.get(serverId);
  if (existingConnection && existingConnection.readyState === WebSocket.OPEN) {
    console.log("closing existing connection for server:", serverId);
    existingConnection.close(1000, 'new connection');
  }
  
  activeConnections.set(serverId, ws);
  
  console.log("processing websocket connection for server:", serverId);
  handleConsoleConnection(ws, serverId as string, request);
}

async function handleConsoleConnection(ws: WebSocket, serverId: string, request: import('http').IncomingMessage) {
  console.log("starting websocket connection handler for server:", serverId);
  let pteroWs: WebSocket | null = null;
  let connectionTimeout: NodeJS.Timeout | null = null;
  let isClosing = false;
  
  const cleanup = () => {
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      connectionTimeout = null;
    }
    if (pteroWs && pteroWs.readyState === WebSocket.OPEN) {
      pteroWs.close();
    }
    if (activeConnections.get(serverId) === ws) {
      activeConnections.delete(serverId);
    }
  };

  const safeClose = (code: number, reason: string) => {
    if (!isClosing && ws.readyState === WebSocket.OPEN) {
      isClosing = true;
      cleanup();
      ws.close(code, reason);
    }
  };

  const safeSend = (data: any) => {
    if (!isClosing && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(data));
      } catch (error) {
        console.error("error sending message to client:", error);
        safeClose(1011, 'send error');
      }
    }
  };
  
  try {
    console.log("checking authentication...");
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) {
      console.log("no cookie header found");
      safeClose(1001, 'no authentication cookies');
      return;
    }
    
    console.log("extracting session token from cookies...");
    const sessionToken = cookieHeader
      .split(';')
      .map(c => c.trim())
      .find(c => c.startsWith('__Secure-authjs.session-token='))
      ?.split('=')[1];
    
    if (!sessionToken) {
      console.log("no session token found in cookies");
      safeClose(1001, 'no session token');
      return;
    }
    

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true }
    });
    
    if (!session || !session.user) {
      console.log("invalid session token");
      safeClose(1001, 'invalid session');
      return;
    }

    if (session.expires < new Date()) {
      console.log("session expired");
      safeClose(1001, 'session expired');
      return;
    }

    const dbServer = await prisma.server.findUnique({ where: { id: serverId } });
    if (!dbServer) {
      console.log("server not found:", serverId);
      safeClose(1000, 'server not found');
      return;
    }

    if (dbServer.userId !== session.user.id) {
      console.log("server not owned by user:", serverId, session.user.id);
      safeClose(1003, 'server not owned by user');
      return;
    }

    const pterodactylId = dbServer.pterodactylServerId;

    console.log("checking pterodactyl configuration...");
    const panelUrl = process.env.PTERODACTYL_PANEL_URL;
    const apiKey = process.env.PTERODACTYL_CLIENT_API_KEY;

    if (!panelUrl || !apiKey) {
      console.error("missing pterodactyl configuration");
      console.log("panel url:", panelUrl ? "set" : "missing");
      console.log("api key:", apiKey ? "set" : "missing");
      safeClose(1011, 'server configuration error');
      return;
    }
    
    console.log("pterodactyl configuration found, panel url:", panelUrl);

    const fetchTimeout = setTimeout(() => {
      safeClose(1011, 'fetch timeout');
    }, 15000);

    console.log("fetching websocket url from pterodactyl...");
    let response;
    try {
      const fetchUrl = `${panelUrl}/api/client/servers/${pterodactylId}/websocket`;
      console.log("fetch url:", fetchUrl);
      response = await fetch(fetchUrl, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });
      clearTimeout(fetchTimeout);
      console.log("fetch response status:", response.status);
    } catch (error) {
      clearTimeout(fetchTimeout);
      console.error("fetch error:", error);
      safeClose(1011, 'fetch error');
      return;
    }

    if (!response.ok) {
      console.error("failed to get websocket url from pterodactyl:", response.status);
      safeClose(1011, 'pterodactyl api error');
      return;
    }

    let data: PteroWSData;
    try {
      const responseData = await response.json() as any;
      data = responseData.data as PteroWSData;
      if (!data.socket || !data.token) {
        throw new Error('invalid websocket data from pterodactyl');
      }
    } catch (error) {
      console.error("error parsing pterodactyl response:", error);
      safeClose(1011, 'invalid response');
      return;
    }

    console.log("creating pterodactyl websocket connection...");
    console.log("pterodactyl websocket url:", data.socket);
    try {
      pteroWs = new WebSocket(data.socket, { 
        headers: { origin: panelUrl },
        timeout: 10000
      });
      console.log("pterodactyl websocket created successfully");
    } catch (error) {
      console.error("error creating pterodactyl websocket:", error);
      safeClose(1011, 'websocket creation error');
      return;
    }

    connectionTimeout = setTimeout(() => {
      if (pteroWs && pteroWs.readyState === WebSocket.CONNECTING) {
        console.error("pterodactyl websocket connection timeout");
        safeClose(1011, 'connection timeout');
      }
    }, 10000);

    pteroWs.on("open", () => {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      console.log("pterodactyl websocket connected");
      try {
        pteroWs!.send(JSON.stringify({ event: "auth", args: [data.token] }));
      } catch (error) {
        console.error("error sending auth to pterodactyl:", error);
        safeClose(1011, 'auth error');
      }
    });

    pteroWs.on("message", (raw: WebSocket.Data) => {
      try {
        const msg = JSON.parse(raw.toString());
        
        if (msg.event === "auth success") {
          console.log("pterodactyl authentication successful");
          try {
            pteroWs!.send(JSON.stringify({ event: "send logs", args: [null] }));
            pteroWs!.send(JSON.stringify({ event: "send stats", args: [null] }));
          } catch (error) {
            console.error("error requesting logs/stats:", error);
          }
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
          safeSend({ type: 'console', data: consoleOutput });
        }

        if (msg.event === "stats") {
          const stats = msg.args[0];
          if (stats) {
            safeSend({ type: 'stats', data: stats });
          }
        }
      } catch (error) {
        console.error("error parsing pterodactyl message:", error);
      }
    });

    pteroWs.on("error", (error: Error) => {
      console.error("pterodactyl websocket error:", error);
      safeSend({ type: 'error', data: 'connection error' });
      safeClose(1011, 'pterodactyl error');
    });

    pteroWs.on("close", (code, reason) => {
      console.log("pterodactyl websocket closed", code, reason?.toString());
      safeSend({ type: 'disconnect', data: 'connection closed' });
      safeClose(1011, 'pterodactyl closed');
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
            try {
              pteroWs.send(JSON.stringify({ event: "send command", args: [message.data] }));
            } catch (error) {
              console.error("error sending command to pterodactyl:", error);
            }
          }
        } else if (message.type === 'ping') {
          safeSend({ type: 'pong' });
        }
      } catch (error) {
        console.error("error parsing client message:", error);
      }
    });

    ws.on("close", (code, reason) => {
      console.log("client websocket closed", code, reason?.toString());
      cleanup();
    });

    ws.on("error", (error: Error) => {
      console.error("client websocket error:", error);
      cleanup();
    });

  } catch (error) {
    console.error("error setting up websocket proxy:", error);
    cleanup();
    safeClose(1011, 'Internal server error');
  }
} 