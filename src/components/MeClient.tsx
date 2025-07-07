"use client";

import { Avatar, Paper, Text, Title, Group, Stack, Button, Badge } from "@mantine/core";
import Link from "next/link";
import type { User } from "@prisma/client";

interface MeClientProps {
  user: User;
}

export default function MeClient({ user }: MeClientProps) {
  return (
    <Stack align="center" gap="xl">
      <Title order={1} style={{ color: "#b3baff", textTransform: 'lowercase' }}>my profile</Title>
      
      <Paper withBorder radius="md" p="xl" style={{ background: "rgba(35, 36, 58, 0.8)", width: '100%', maxWidth: 600 }}>
        <Group>
          <Avatar src={user.image} size="xl" radius="xl" />
          <div style={{ flex: 1 }}>
            <Title order={3}>{user.name}</Title>
            <Text c="dimmed">{user.email}</Text>
          </div>
          {user.admin && <Badge color="red" variant="filled">admin</Badge>}
        </Group>
      </Paper>
      
      <Paper withBorder radius="md" p="xl" style={{ background: "rgba(35, 36, 58, 0.8)", width: '100%', maxWidth: 600 }}>
        <Title order={4} mb="md" style={{color: "#b3baff" }}>account details</Title>
        <Stack>
            <Group justify="space-between">
                <Text>joined:</Text>
                <Text>{new Date(user.createdAt).toLocaleDateString()}</Text>
            </Group>
             <Group justify="space-between">
                <Text>verified:</Text>
                {user.verified ? (
                  <Badge color="green" variant="light">verified</Badge>
                ) : (
                  <Badge color="gray" variant="light">not verified</Badge>
                )}
            </Group>
            <Group justify="space-between">
                <Text>server limit:</Text>
                <Text>{user.limit}</Text>
            </Group>
        </Stack>
      </Paper>
      
      <Group>
        <Button component={Link} href="/dashboard" variant="outline" color="gray" radius="md">back to dashboard</Button>
      </Group>
    </Stack>
  );
} 