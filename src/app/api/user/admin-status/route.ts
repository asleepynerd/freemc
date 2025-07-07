import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ isAdmin: false });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { admin: true }
    });

    return NextResponse.json({ isAdmin: user?.admin || false });
  } catch (error) {
    console.error('Failed to check admin status:', error);
    return NextResponse.json({ isAdmin: false });
  }
} 