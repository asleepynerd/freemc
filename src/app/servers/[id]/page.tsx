import ServerDetailClient from "@/components/ServerDetailClient";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { app, client, ipMappings } from "@/lib/pterodactyl";

export default async function ServerDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/");
  }
  
  const server = await prisma.server.findUnique({ where: { id } });
  console.log(server);
  
  if (!server) {
    return notFound();
  }
  
  if (server.userId !== session.user.id) {
    return notFound();
  }
  
  const pteroServer = await client.servers.getDetails(server.pterodactylServerId.toString());
  const allocation = await client.network.listAllocations(server.pterodactylServerId.toString());
  const ip = ipMappings[allocation.data[0].attributes.ip as keyof typeof ipMappings];
  const port = allocation.data[0].attributes.port;
  const serverData = {
    name: pteroServer.attributes.name,
    type: server.type,
    ram: server.ram,
    cores: server.cores,
    address: `${ip}:${port}`
  };

  console.log(serverData);

  return <ServerDetailClient id={id} initialServer={serverData} />;
} 