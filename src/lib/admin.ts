import prisma from './prisma';
import { auth } from './auth';

export async function checkServerAccess(serverId: string, userId: string): Promise<boolean> {
  const server = await prisma.server.findUnique({ 
    where: { id: serverId },
    select: { userId: true }
  });
  
  if (!server) {
    return false;
  }
  
  if (server.userId === userId) {
    return true;
  }
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { admin: true }
  });
  
  return user?.admin || false;
}

export async function requireAuth() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return null;
  }
  return session.user.id;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return null;
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { admin: true }
  });
  
  if (!user || !user.admin) {
    return null;
  }
  
  return session.user.id;
} 