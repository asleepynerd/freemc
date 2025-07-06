import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Container, Title, Text, Paper, Stack, Group, Anchor } from "@mantine/core";
import { ServerPowerButtons } from "@/components/ServerPowerButtons";
import ServerConsoleClientWrapper from "@/components/ServerConsoleClientWrapper";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { auth } from "@/lib/auth";
import { app, client, ipMappings } from "@/lib/pterodactyl";

export default async function ServerPage(context: any) {
  const { id } = await context.params;
  const session = await auth();
  
  if (!session || !session.user || !session.user.id) {
    return notFound();
  }

  const server = await prisma.server.findUnique({
    where: { id },
  });
  
  if (!server || server.userId !== session.user.id) {
    return notFound();
  }


  let pteroName = "your server";
  let ip = 'N/A';
  let port = 'N/A';
  try {
    const servers = await app.servers.list();
    const pteroServer = servers.data.find((s: any) => s.attributes.identifier === server.pterodactylServerId);
    //console.log(JSON.stringify(pteroServer));
    pteroName = pteroServer?.attributes.name || "your server";
    const nodes = await app.nodes.list();
    const node = nodes.data.find((n: any) => n.attributes.id === pteroServer?.attributes.node);
    const network = pteroServer?.attributes.identifier ? await client.network.listAllocations(pteroServer.attributes.identifier.toString()) : null;
    if (network?.data[0]?.attributes?.ip) {
      ip = ipMappings[network.data[0].attributes.ip as keyof typeof ipMappings] || 'N/A';
    }
    port = network?.data[0]?.attributes?.port?.toString() || 'N/A';
  } catch (error) {
    console.error('failed to fetch pterodactyl server details:', error);
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Group align="center" gap="xs">
          <Anchor component={Link} href="/dashboard" style={{ color: "#b3baff", display: "flex", alignItems: "center" }}>
            <IconArrowLeft size={20} style={{ marginRight: 6 }} />
            back to dashboard
          </Anchor>
        </Group>
        <Paper withBorder p="md" radius="md" style={{ background: "#23243a" }}>
          <Title order={3} style={{ color: "#b3baff" }}>{pteroName}</Title>
          <Text>type: <b>{server.type}</b></Text>
          <Text>ram: <b>{server.ram}MB</b></Text>
          <Text>cores: <b>{server.cores}</b></Text>
          <Text>IP: <b>{ip}:{port}</b></Text>
          <ServerPowerButtons serverId={id} />
        </Paper>
        <ServerConsoleClientWrapper serverId={id} />
      </Stack>
    </Container>
  );
} 