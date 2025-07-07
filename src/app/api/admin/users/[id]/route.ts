import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(req: Request, context: any) {
  const { id } = await context.params;
  
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'invalid user id' }, { status: 400 });
  }
  
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { admin: true }
  });

  if (!adminUser || !adminUser.admin) {
    return NextResponse.json({ error: 'admin access required' }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, limit, admin, verified } = body;

  try {
    const updates: any = {};
    
    if (name !== undefined) {
      if (typeof name !== 'string' || name.length > 100) {
        return NextResponse.json({ error: 'invalid name' }, { status: 400 });
      }
      updates.name = name || null;
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || (email.length > 0 && !email.includes('@'))) {
        return NextResponse.json({ error: 'invalid email' }, { status: 400 });
      }
      updates.email = email || null;
    }

    if (limit !== undefined) {
      if (typeof limit !== 'number' || limit < 0 || limit > 50) {
        return NextResponse.json({ error: 'limit must be between 0 and 50' }, { status: 400 });
      }
      updates.limit = limit;
    }

    if (admin !== undefined) {
      if (typeof admin !== 'boolean') {
        return NextResponse.json({ error: 'admin must be boolean' }, { status: 400 });
      }
      updates.admin = admin;
    }

    if (verified !== undefined) {
      if (typeof verified !== 'boolean') {
        return NextResponse.json({ error: 'verified must be boolean' }, { status: 400 });
      }
      updates.verified = verified;
    }

    const targetUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'user not found' }, { status: 404 });
    }

    if (id === session.user.id && admin === false) {
      return NextResponse.json({ error: 'cannot remove your own admin status' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updates
    });

    return NextResponse.json({ 
      message: 'user updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        limit: updatedUser.limit,
        admin: updatedUser.admin,
        verified: updatedUser.verified
      }
    });

  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: any) {
  const { id } = await context.params;
  
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'invalid user id' }, { status: 400 });
  }
  
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { admin: true }
  });

  if (!adminUser || !adminUser.admin) {
    return NextResponse.json({ error: 'admin access required' }, { status: 403 });
  }

  if (id === session.user.id) {
    return NextResponse.json({ error: 'cannot delete your own account' }, { status: 400 });
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        servers: true
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'user not found' }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: 'user deleted successfully',
      deletedServers: targetUser.servers.length
    });

  } catch (error) {
    console.error('failed to delete user:', error);
    return NextResponse.json({ error: 'failed to delete user' }, { status: 500 });
  }
} 