import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import FileManagerClient from "@/components/FileManagerClient";

export default async function FileManagerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/");
  }
  
  const server = await prisma.server.findUnique({ where: { id } });
  
  if (!server) {
    return notFound();
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { admin: true }
  });
  
  if (server.userId !== session.user.id && (!user || !user.admin)) {
    return notFound();
  }

  return <FileManagerClient serverId={id} />;
}
