import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { app, ipMappings, client } from '@/lib/pterodactyl';

export async function DELETE(req: Request, context: any) {
  const { id } = context.params;
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const server = await prisma.server.findUnique({ where: { id } });
  if (!server || server.userId !== session.user.id) {
    return NextResponse.json({ error: 'server not found or not owned by user' }, { status: 404 });
  }

  try {
    const servers = await app.servers.list();
    const pteroServer = servers.data.find((s: any) => s.attributes.identifier === server.pterodactylServerId);
    if (pteroServer) {
      await app.servers.delete(pteroServer.attributes.id.toString());
    } else {
      console.warn('server not found in pterodactyl for deletion:', server.pterodactylServerId);
    }
  } catch (e) {
    console.error('failed to delete server from pterodactyl:', e);
  }

  await prisma.server.delete({ where: { id } });

  return NextResponse.json({ success: true });
} 

export async function PATCH(req: Request, context: any) {
  const { id } = context.params;
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const server = await prisma.server.findUnique({ where: { id } });
  if (!server || server.userId !== session.user.id) {
    return NextResponse.json({ error: 'server not found or not owned by user' }, { status: 404 });
  }

  const { name } = await req.json();
  if (!name || typeof name !== 'string' || name.length < 2 || name.length > 64) {
    return NextResponse.json({ error: 'invalid name' }, { status: 400 });
  }

  try {
    await app.servers.updateDetails(server.pterodactylServerId, { name });
  } catch (e) {
    return NextResponse.json({ error: 'failed to update name in panel' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function GET(req: Request, context: any) {
  const { id } = context.params;
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const server = await prisma.server.findUnique({ where: { id } });

  if (!server) {
    return NextResponse.json({ error: 'server not found' }, { status: 404 });
  }
  if (server?.userId !== session.user.id) {
    return NextResponse.json({ error: 'server not found or not owned by user' }, { status: 404 });
  }

  const pteroServer = await app.servers.list();

  const ptero = pteroServer.data.find((s: any) => s.attributes.identifier === server.pterodactylServerId);
  if (!ptero) {
    return NextResponse.json({ error: 'server not found in panel' }, { status: 404 });
  }

  const allocation = await client.network.listAllocations(server.pterodactylServerId.toString());
  const ip = ipMappings[allocation.data[0].attributes.ip as keyof typeof ipMappings];
  const port = allocation.data[0].attributes.port;

  return NextResponse.json({
    name: ptero.attributes.name,
    type: server.type,
    ram: server.ram,
    cores: server.cores,
    address: `${ip}:${port}`
  });
}