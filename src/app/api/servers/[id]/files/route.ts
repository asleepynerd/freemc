import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { client } from '@/lib/pterodactyl';
import { checkServerAccess, requireAuth } from '@/lib/admin';
import fetch from 'node-fetch';

export async function GET(req: Request, context: any) {
  const { id } = await context.params;
  const { searchParams } = new URL(req.url);
  const directory = searchParams.get('directory') || '/';
  
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
    const apiKey = process.env.PTERODACTYL_CLIENT_API_KEY;
    const panelUrl = process.env.PTERODACTYL_PANEL_URL;
    
    if (!apiKey || !panelUrl) {
      throw new Error('pterodactyl configuration missing');
    }
    
    const response = await fetch(`${panelUrl}/api/client/servers/${server.pterodactylServerId}/files/list?directory=${encodeURIComponent(directory)}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`api returned ${response.status}`);
    }
    
    const data = await response.json() as { data: any };
    return NextResponse.json(data.data);
  } catch (error) {
    console.error('failed to list files:', error);
    return NextResponse.json({ error: 'failed to list files' }, { status: 500 });
  }
}

export async function POST(req: Request, context: any) {
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

  const body = await req.json();
  const { action, name, directory = '/' } = body;

  try {
    if (action === 'create_folder') {
      if (!name || typeof name !== 'string' || name.length < 1) {
        return NextResponse.json({ error: 'invalid folder name' }, { status: 400 });
      }
      
      const apiKey = process.env.PTERODACTYL_CLIENT_API_KEY;
      const panelUrl = process.env.PTERODACTYL_PANEL_URL;
      
      if (!apiKey || !panelUrl) {
        throw new Error('pterodactyl configuration missing');
      }
      
      const response = await fetch(`${panelUrl}/api/client/servers/${server.pterodactylServerId}/files/create-folder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          root: directory,
          name: name
        }),
      });
      
      if (!response.ok) {
        throw new Error(`api returned ${response.status}`);
      }
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'invalid action' }, { status: 400 });
  } catch (error) {
    console.error('failed to create folder:', error);
    return NextResponse.json({ error: 'failed to create folder' }, { status: 500 });
  }
}

export async function PUT(req: Request, context: any) {
  const { id } = context.params;
  const { searchParams } = new URL(req.url);
  const directory = searchParams.get('directory') || '/';
  
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
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'no files provided' }, { status: 400 });
    }

    const apiKey = process.env.PTERODACTYL_CLIENT_API_KEY;
    const panelUrl = process.env.PTERODACTYL_PANEL_URL;
    
    if (!apiKey || !panelUrl) {
      throw new Error('Pterodactyl configuration missing');
    }

    const results = [];
    for (const file of files) {
      try {
        const uploadFormData = new FormData();
        uploadFormData.append('files', file);
        
        const response = await fetch(`${panelUrl}/api/client/servers/${server.pterodactylServerId}/files/upload?directory=${encodeURIComponent(directory)}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
          body: uploadFormData,
        });
        
        if (!response.ok) {
          throw new Error(`failed to upload ${file.name}: API returned ${response.status}`);
        }
        
        results.push({ name: file.name, success: true });
      } catch (error) {
        console.error(`failed to upload ${file.name}:`, error);
        results.push({ name: file.name, success: false, error: (error as Error).message });
      }
    }
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('failed to upload files:', error);
    return NextResponse.json({ error: 'failed to upload files' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: any) {
  const { id } = context.params;
  const { searchParams } = new URL(req.url);
  const file = searchParams.get('file');
  
  if (!id || typeof id !== 'string' || id.length < 1) {
    return NextResponse.json({ error: 'invalid server id' }, { status: 400 });
  }
  
  if (!file) {
    return NextResponse.json({ error: 'file parameter required' }, { status: 400 });
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
    const apiKey = process.env.PTERODACTYL_CLIENT_API_KEY;
    const panelUrl = process.env.PTERODACTYL_PANEL_URL;
    
    if (!apiKey || !panelUrl) {
      throw new Error('pterodactyl configuration missing');
    }
    
    const response = await fetch(`${panelUrl}/api/client/servers/${server.pterodactylServerId}/files/delete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: [file]
      }),
    });
    
    if (!response.ok) {
      throw new Error(`api returned ${response.status}`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('failed to delete file:', error);
    return NextResponse.json({ error: 'failed to delete file' }, { status: 500 });
  }
} 