import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { app, ipMappings, client } from '@/lib/pterodactyl';
import { checkServerAccess, requireAuth } from '@/lib/admin';
import { Resolver } from 'dns/promises';
import net from 'net';

export async function DELETE(req: Request, context: any) {
  const { id } = context.params;
  
  if (!id || typeof id !== 'string' || id.length < 1) {
    return NextResponse.json({ error: 'invalid server id' }, { status: 400 });
  }
  
  const userId = await requireAuth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!(await checkServerAccess(id, userId))) {
    return NextResponse.json({ error: 'server not found or access denied' }, { status: 404 });
  }

  const server = await prisma.server.findUnique({ where: { id } });
  if (!server) {
    return NextResponse.json({ error: 'server not found' }, { status: 404 });
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
  const { id } = await context.params;
  if (!id || typeof id !== 'string' || id.length < 1) {
    return NextResponse.json({ error: 'invalid server id' }, { status: 400 });
  }
  
  const userId = await requireAuth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!(await checkServerAccess(id, userId))) {
    return NextResponse.json({ error: 'server not found or access denied' }, { status: 404 });
  }

  const server = await prisma.server.findUnique({ where: { id } });
  if (!server) {
    return NextResponse.json({ error: 'server not found' }, { status: 404 });
  }

  const body = await req.json();
  const updates: any = {};

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.length < 2 || body.name.length > 64) {
      return NextResponse.json({ error: 'invalid name' }, { status: 400 });
    }
    try {
      await app.servers.updateDetails(server.pterodactylServerId, { name: body.name });
      updates.name = body.name;
    } catch (e) {
      console.error('failed to update server name:', e);
      return NextResponse.json({ error: 'failed to update name in panel' }, { status: 500 });
    }
  }

  if (body.address !== undefined) {
    console.log(body.address);
    if (typeof body.address !== 'string' || body.address.length < 1 || body.address.length > 128) {
      return NextResponse.json({ error: 'invalid address' }, { status: 400 });
    }
    
    if (server.type !== 2 && server.type !== 5) {
      return NextResponse.json({ error: 'custom addresses are only available for Minecraft servers' }, { status: 400 });
    }
    try {
      const resolver = new Resolver();
      resolver.setServers(['1.1.1.1']);
      const srvDomain = `_minecraft._tcp.${body.address}`;
      console.log(srvDomain);
      const srvRecords = await resolver.resolveSrv(srvDomain);
      console.log(srvRecords);
      console.log(body.address);
      if (!srvRecords.length) {
        return NextResponse.json({ error: `No SRV record found for ${srvDomain}. Please create an SRV record for your domain.` }, { status: 400 });
      }
      const srv = srvRecords[0];
      const allocation = await client.network.listAllocations(server.pterodactylServerId.toString());
      const expectedIp = ipMappings[allocation.data[0].attributes.ip as keyof typeof ipMappings] || allocation.data[0].attributes.ip;
      const expectedPort = allocation.data[0].attributes.port;
      if (srv.port !== expectedPort) {
        return NextResponse.json({ error: `SRV record port (${srv.port}) does not match your server's port (${expectedPort}).` }, { status: 400 });
      }
      if (srv.weight !== 10 || srv.priority !== 10) {
        return NextResponse.json({ error: `SRV record weight/priority must both be 10. Found weight=${srv.weight}, priority=${srv.priority}.` }, { status: 400 });
      }
      if (srv.name !== expectedIp) {
        return NextResponse.json({ error: `SRV record name (${srv.name}) does not match your server's IP (${expectedIp}).` }, { status: 400 });
      }
      updates.address = body.address;
    } catch (e: any) {
      return NextResponse.json({ error: `failed to verify SRV record: ${e.message}.\n\nTo use a custom domain, create an SRV record like this:\n\nService: _minecraft\nProtocol: _tcp\nName: <your subdomain>\nPriority: 10\nWeight: 10\nPort: <your server port>\nTarget: <your server IP or hostname>\n\nExample: _minecraft._tcp.mc.example.com SRV 10 10 25565 1.2.3.4` }, { status: 400 });
    }
  }

  if (Object.keys(updates).length > 0) {
    await prisma.server.update({ where: { id }, data: updates });
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ error: 'no valid fields to update' }, { status: 400 });
  }
}

export async function GET(req: Request, context: any) {
  const { id } = context.params;
  
  if (!id || typeof id !== 'string' || id.length < 1) {
    return NextResponse.json({ error: 'invalid server id' }, { status: 400 });
  }
  
  const userId = await requireAuth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!(await checkServerAccess(id, userId))) {
    return NextResponse.json({ error: 'server not found or access denied' }, { status: 404 });
  }

  const server = await prisma.server.findUnique({ where: { id } });
  if (!server) {
    return NextResponse.json({ error: 'server not found' }, { status: 404 });
  }

  try {
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
      address: server.address || `${ip}:${port}`
    });
  } catch (error) {
    console.error('failed to get server details:', error);
    return NextResponse.json({ error: 'failed to get server details' }, { status: 500 });
  }
}