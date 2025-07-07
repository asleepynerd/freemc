import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { client } from '@/lib/pterodactyl';
import fetch from 'node-fetch';

export async function GET(req: Request, context: any) {
  const { id, file } = await context.params;
  
  if (!id || typeof id !== 'string' || id.length < 1) {
    return NextResponse.json({ error: 'invalid server id' }, { status: 400 });
  }
  
  if (!file || !Array.isArray(file) || file.length < 1) {
    return NextResponse.json({ error: 'invalid file path' }, { status: 400 });
  }
  
  const filePath = file.join('/');
  
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const server = await prisma.server.findUnique({ where: { id } });
  if (!server || server.userId !== session.user.id) {
    return NextResponse.json({ error: 'server not found or not owned by user' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const download = searchParams.get('download') === 'true';

  try {
    const apiKey = process.env.PTERODACTYL_CLIENT_API_KEY;
    const panelUrl = process.env.PTERODACTYL_PANEL_URL;
    
    if (!apiKey || !panelUrl) {
      throw new Error('pterodactyl configuration missing');
    }
    
    if (download) {
      const response = await fetch(`${panelUrl}/api/client/servers/${server.pterodactylServerId}/files/download?file=${encodeURIComponent(filePath)}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`api returned ${response.status}`);
      }
      
      const data = await response.json() as { attributes: { url: string } };
      return NextResponse.json({ downloadUrl: data.attributes.url });
    } else {
      const response = await fetch(`${panelUrl}/api/client/servers/${server.pterodactylServerId}/files/contents?file=${encodeURIComponent(filePath)}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error('failed to get file:', response.status, response.statusText);
        throw new Error(`api returned ${response.status}`);
      }
      
      const contents = await response.text();
      return NextResponse.json({ contents });
    }
  } catch (error) {
    console.error('failed to get file:', error);
    return NextResponse.json({ error: 'failed to get file' }, { status: 500 });
  }
}

export async function POST(req: Request, context: any) {
  const { id, file } = context.params;
  
  if (!id || typeof id !== 'string' || id.length < 1) {
    return NextResponse.json({ error: 'invalid server id' }, { status: 400 });
  }
  
  if (!file || !Array.isArray(file) || file.length < 1) {
    return NextResponse.json({ error: 'invalid file path' }, { status: 400 });
  }
  
  const filePath = file.join('/');
  
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const server = await prisma.server.findUnique({ where: { id } });
  if (!server || server.userId !== session.user.id) {
    return NextResponse.json({ error: 'server not found or not owned by user' }, { status: 404 });
  }

  const body = await req.json();
  const { contents } = body;

  if (typeof contents !== 'string') {
    return NextResponse.json({ error: 'contents must be a string' }, { status: 400 });
  }

  try {
    const apiKey = process.env.PTERODACTYL_CLIENT_API_KEY;
    const panelUrl = process.env.PTERODACTYL_PANEL_URL;
    
    if (!apiKey || !panelUrl) {
      throw new Error('pterodactyl configuration missing');
    }
    
    const response = await fetch(`${panelUrl}/api/client/servers/${server.pterodactylServerId}/files/write?file=${encodeURIComponent(filePath)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'text/plain',
      },
      body: contents,
    });
    
    if (!response.ok) {
      throw new Error(`api returned ${response.status}`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('failed to write file:', error);
    return NextResponse.json({ error: 'failed to write file' }, { status: 500 });
  }
} 