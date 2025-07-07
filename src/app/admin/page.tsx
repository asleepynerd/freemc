import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminPanelClient from "@/components/AdminPanelClient";

export default async function AdminPage() {
  const session = await auth();
  
  if (!session || !session.user || !session.user.id) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { admin: true }
  });

  if (!user || !user.admin) {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    include: {
      servers: {
        select: {
          id: true,
          pterodactylServerId: true,
          type: true,
          ram: true,
          cores: true,
          address: true,
          createdAt: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const allServers = await prisma.server.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return <AdminPanelClient users={users} servers={allServers} />;
} 