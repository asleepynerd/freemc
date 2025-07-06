import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { app, client } from '@/lib/pterodactyl';

const serverTypeDetails: { [key: number]: { name: string; ram: number; cores: number; disk: number; egg: number; image: string } } = {
    2: { name: 'Vanilla', ram: 4096, cores: 2, disk: 1024, egg: 2, image: 'ghcr.io/pterodactyl/yolks:java_21' },
    3: { name: 'Forge', ram: 6144, cores: 4, disk: 4096, egg: 3, image: 'ghcr.io/pterodactyl/yolks:java_21' },
    5: { name: 'Paper', ram: 4096, cores: 4, disk: 2048, egg: 5, image: 'ghcr.io/pterodactyl/yolks:java_21' },
};

const AVAILABLE_NODES = [2, 3];
const FIXED_USER_ID = '9';

async function getLeastLoadedNode() {
    const nodes = await app.nodes.list();
    const availableNodes = nodes.data.filter(node => AVAILABLE_NODES.includes(node.attributes.id));
    
    if (availableNodes.length === 0) {
        throw new Error('no available nodes found');
    }

    let bestNode = availableNodes[0];
    let maxAvailableMemory = 0;

    for (const node of availableNodes) {
        const totalMemory = node.attributes.memory;
        const usedMemory = node.attributes.memory_overallocate || 0;
        const availableMemory = totalMemory - usedMemory;

        if (availableMemory > maxAvailableMemory) {
            maxAvailableMemory = availableMemory;
            bestNode = node;
        }
    }

    return bestNode.attributes.id;
}

async function retryWriteEula(serverId: string, retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
        await client.files.write(serverId, "/eula.txt", "eula=true\n"); 
      return true;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(res => setTimeout(res, delay));
    }
  }
  return false;
}

async function retryStartServer(serverId: string, retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await client.servers.powerAction(serverId, "start");
      return true;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(res => setTimeout(res, delay));
    }
  }
  return false;
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session || !session.user || !session.user.id || !session.user.email) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { type } = await req.json();

    if (!type || !serverTypeDetails[type]) {
        return NextResponse.json({ error: 'invalid server type' }, { status: 400 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;
    const userName = session.user.name || userEmail.split('@')[0];

    const serverCount = await prisma.server.count({ where: { userId } });
    if (serverCount >= 2) {
        return NextResponse.json({ error: 'you have reached the maximum number of servers (2).' }, { status: 403 });
    }

    try {
        const selectedNodeId = await getLeastLoadedNode();
        
        const details = serverTypeDetails[type];
        
        const environment: { [key: string]: string } = {
            SERVER_JARFILE: "server.jar",
            VANILLA_VERSION: "latest",
            FORGE_VERSION: "latest",
            PAPER_VERSION: "latest",
            MINECRAFT_VERSION: "1.20.4",
            SERVER_NAME: `${userName}'s ${details.name} Server`,
            SERVER_PORT: "25565",
            EULA: "true",
            ENABLE_RCON: "false",
            RCON_PORT: "25575",
            RCON_PASSWORD: "",
            MEMORY: `${details.ram}M`,
            MAX_PLAYERS: "20",
            VIEW_DISTANCE: "10",
            SPAWN_PROTECTION: "16",
            MOTD_1: "Welcome to the server!",
            MOTD_2: "Have fun playing!",
        };
        
        const newPteroServer = await app.servers.create({
            name: `${userName}'s ${details.name} server`,
            user: FIXED_USER_ID,
            egg: details.egg,
            docker_image: details.image,
            startup: `java -Xms128M -Xmx${details.ram}M -jar server.jar`,
            limits: {
                memory: details.ram,
                swap: 0,
                disk: details.disk,
                io: 500,
                cpu: details.cores * 100,
            },
            feature_limits: {
                databases: 1,
                allocations: 1,
                backups: 2,
            },
            environment: environment,
            deploy: {
                locations: [selectedNodeId],
                dedicated_ip: false,
                port_range: [],
            },
        });

        const newServer = await prisma.server.create({
            data: {
                userId,
                pterodactylServerId: newPteroServer.attributes.identifier.toString(),
                type,
                ram: details.ram,
                cores: details.cores,
            },
        });

        try {
            await retryWriteEula(newPteroServer.attributes.uuid.toString());
        } catch (e) {
            console.error("failed to set eula.txt after retries:", e);
        }

        try {
            await retryStartServer(newPteroServer.attributes.identifier.toString());
        } catch (e) {
            console.error("failed to auto-start server after retries:", e);
        }

        return NextResponse.json(newServer);
    } catch (error: any) {
        console.error("server creation failed:", error?.response?.data || error.message);
        return NextResponse.json({ error: 'failed to create server. please contact support.' }, { status: 500 });
    }
} 