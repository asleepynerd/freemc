import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Container, Title, Text, Stack, Button, SimpleGrid, Paper, Group } from "@mantine/core";
import { ServerCreator } from "@/components/ServerCreator";
import { ServerList } from "@/components/ServerList";
import { LogoutButton } from "@/components/auth";
import { app } from "@/lib/pterodactyl";

export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return null;
  }

  const servers = await prisma.server.findMany({
    where: { userId: session.user.id },
  });

  let pteroServers: any[] = [];
  try {
    const pteroList = await app.servers.list();
    pteroServers = pteroList.data.map((s: any) => s.attributes);
  } catch (e) {
    // fallback: no names
    pteroServers = [];
  }

  const serversWithNames = servers.map((srv: any) => {
    const ptero = pteroServers.find((p: any) => p.identifier === srv.pterodactylServerId);
    return { ...srv, name: ptero?.name };
  });

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={2} style={{ color: "#b3baff" }}>your servers</Title>
          <LogoutButton />
        </Group>
        <Text size="lg" style={{ color: "#ededed", opacity: 0.8 }}>
          manage your servers below.
        </Text>
        <ServerList servers={serversWithNames} />
        {servers.length < 2 ? <ServerCreator /> : <Text mt="md">you have reached the maximum number of servers.</Text>}
      </Stack>
    </Container>
  );
} 