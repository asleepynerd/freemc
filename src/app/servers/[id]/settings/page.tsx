import { Container, Title, Text, Stack, Button, Group, Paper, TextInput, Loader, Modal } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import ServerSettingsClient from "@/components/ServerSettingsClient";
import { client, app, ipMappings } from "@/lib/pterodactyl";

export default async function ServerSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/");
  }
  
  const server = await prisma.server.findUnique({ where: { id } });
  
  if (!server) {
    return notFound();
  }
  
  if (server.userId !== session.user.id) {
    return notFound();
  }

  let serverName = "";
  try {
    const pteroServer = await app.servers.list();
    const ptero = pteroServer.data.find((s: any) => s.attributes.identifier === server.pterodactylServerId);
    serverName = ptero?.attributes.name || "Unknown Server";
  } catch (error) {
    console.error("Failed to get server name from Pterodactyl:", error);
    serverName = "Unknown Server";
  }

  return <ServerSettingsClient id={id} serverName={serverName} />;
} 