import { NextResponse } from 'next/server';
import { client } from '@/lib/pterodactyl';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { checkServerAccess, requireAuth } from '@/lib/admin';

export async function POST(req: Request, context: any) {
    const { id } = await context.params;
    
    if (!id || typeof id !== 'string' || id.length < 1) {
        return NextResponse.json({ error: 'invalid server id' }, { status: 400 });
    }
    
    const userId = await requireAuth();
    if (!userId) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { action } = await req.json();
    const validActions = ["start", "stop", "restart"];
    if (!action || !validActions.includes(action)) {
        return NextResponse.json({ error: 'invalid action' }, { status: 400 });
    }

    if (!(await checkServerAccess(id, userId))) {
        return NextResponse.json({ error: 'server not found or access denied' }, { status: 404 });
    }

    const dbServer = await prisma.server.findUnique({ where: { id } });
    if (!dbServer) {
        return NextResponse.json({ error: 'server not found' }, { status: 404 });
    }

    try {
        await client.servers.powerAction(dbServer.pterodactylServerId, action as "start" | "stop" | "restart" | "kill");
        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('Power action failed:', e);
        return NextResponse.json({ error: 'failed to send power action' }, { status: 500 });
    }
} 