"use client";
import { ServerPowerButtons } from "./ServerPowerButtons";
import Link from "next/link";
import { Paper, Text, Group, Box } from "@mantine/core";

export function ServerList({ servers }: { servers: any[] }) {
  return (
    <Group gap="md" align="stretch" style={{ flexWrap: "wrap" }}>
      {servers.map((server, idx) => (
        <Paper
          withBorder
          p="md"
          key={server.id}
          radius="lg"
          style={{
            minWidth: 320,
            maxWidth: 400,
            background: "#23243a",
            boxShadow: "0 2px 16px #18192633",
            transition: "box-shadow 0.2s, transform 0.2s",
            cursor: "pointer",
          }}
          component={Link}
          href={`/servers/${server.id}`}
          onClick={e => e.stopPropagation()}
          onMouseOver={e => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 32px #b3baff33";
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px) scale(1.01)";
          }}
          onMouseOut={e => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 16px #18192633";
            (e.currentTarget as HTMLElement).style.transform = "none";
          }}
        >
          <Box mb={8}>
            <Text fw={700} style={{ fontSize: 20, color: "#b3baff" }}>
              {server.name || `your server #${idx + 1}`}
            </Text>
            <Text size="sm" style={{ color: "#ededed", opacity: 0.7 }}>
              Type: {server.type} | RAM: {server.ram}MB | Cores: {server.cores}
            </Text>
          </Box>
          <ServerPowerButtons serverId={server.pterodactylServerId} />
        </Paper>
      ))}
    </Group>
  );
} 