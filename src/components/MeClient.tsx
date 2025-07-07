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
      
      <Paper withBorder radius="md" p="xl" style={{ background: "rgba(35, 36, 58, 0.8)", width: '100%', maxWidth: 600, border: "1px solid rgba(179, 186, 255, 0.3)", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}>
        <Group>
          <Avatar src={user.image} size="xl" radius="xl" />
          <div style={{ flex: 1 }}>
            <Title order={3} style={{ position: "relative", zIndex: 10, display: 'block', visibility: 'visible' }}>{user.name}</Title>
            <Text c="dimmed" style={{ position: "relative", zIndex: 10, display: 'block', visibility: 'visible' }}>{user.email}</Text>
          </div>
          {user.admin && <Badge color="red" variant="filled">admin</Badge>}
        </Group>
      </Paper>
      
      <Paper 
        withBorder 
        p="lg" 
        radius="lg" 
        style={{ 
          background: "rgba(24, 25, 38, 0.7)", 
          backdropFilter: "blur(8px)", 
          boxShadow: "0 2px 12px rgba(24, 25, 38, 0.2)", 
          border: "1px solid rgba(179, 186, 255, 0.08)", 
          width: '100%', 
          maxWidth: 600 
        }}
      >
        <Title order={4} mb="md" style={{color: "#b3baff", textTransform: 'lowercase', position: "relative", zIndex: 10, display: 'block', visibility: 'visible' }}>account details</Title>
        <Stack>
            <Group justify="space-between">
                <Text style={{ position: "relative", zIndex: 10, display: 'block', visibility: 'visible' }}>joined:</Text>
                <Text style={{ position: "relative", zIndex: 10, display: 'block', visibility: 'visible' }}>{new Date(user.createdAt).toLocaleDateString()}</Text>
            </Group>
             <Group justify="space-between">
                <Text style={{ position: "relative", zIndex: 10, display: 'block', visibility: 'visible' }}>verified:</Text>
                <div style={{ position: "relative", zIndex: 10 }}>
                  {user.verified ? (
                    <Badge color="green" variant="light">verified</Badge>
                  ) : (
                    <Badge color="gray" variant="light">not verified</Badge>
                  )}
                </div>
            </Group>
            <Group justify="space-between">
                <Text style={{ position: "relative", zIndex: 10, display: 'block', visibility: 'visible' }}>server limit:</Text>
                <Text style={{ position: "relative", zIndex: 10, display: 'block', visibility: 'visible' }}>{user.limit}</Text>
            </Group>
        </Stack>
      </Paper>
      
      <Group>
        <Button component={Link} href="/dashboard" variant="outline" color="gray" radius="md">back to dashboard</Button>
      </Group>
    </Stack>
  );
} 