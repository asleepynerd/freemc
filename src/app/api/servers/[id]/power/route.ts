import { NextResponse } from 'next/server';
import { client } from '@/lib/pterodactyl';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request, context: any) {
    const { id } = await context.params;
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { action } = await req.json();
    const validActions = ["start", "stop", "restart"];
    if (!validActions.includes(action)) {
        return NextResponse.json({ error: 'invalid action' }, { status: 400 });
    }

    const dbServer = await prisma.server.findUnique({ where: { id } });
    if (!dbServer || dbServer.userId !== session.user.id) {
        return NextResponse.json({ error: 'server not found or not owned by user' }, { status: 404 });
    }

    try {
        await client.servers.powerAction(dbServer.pterodactylServerId, action as "start" | "stop" | "restart" | "kill");
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'failed to send power action' }, { status: 500 });
    }
} 