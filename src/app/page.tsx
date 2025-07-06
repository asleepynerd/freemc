"use client";
import { Container, Stack, Title, Text, Button, SimpleGrid, Paper, Group } from "@mantine/core";
import Link from "next/link";
import { IconWorld, IconLock, IconSparkles } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  return (
    <Container size="lg" py="xl" style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
      <Stack align="center" gap={0} mb={48} style={{ width: "100%", maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <Title order={1} style={{
          fontSize: "3.5rem",
          fontWeight: 900,
          color: "#fff",
          letterSpacing: -2,
          textShadow: "0 4px 32px #181926, 0 2px 8px #23243a, 0 0px 1px #000",
          textAlign: "center",
          lineHeight: 1.1
        }}>
          freehost
        </Title>
        <Text size="lg" style={{ color: "#ededed", marginTop: 16, textAlign: "center", maxWidth: 600, opacity: 0.92, fontSize: "1.1rem", lineHeight: 1.6 }}>
          effortlessly host and manage your game servers in the cloud.<br />fast, secure, and made for everyone.<br /><span style={{ color: "#b3baff", fontWeight: 600 }}>no experience required.</span>
        </Text>
        {session ? (
          <Button component={Link} href="/dashboard" color="violet" radius="md" size="lg" mt={32} style={{ marginTop: 32, fontWeight: 700, letterSpacing: 1, fontSize: "1.1rem", padding: "0.75rem 2rem" }}>
            go to dashboard
          </Button>
        ) : (
          <Button onClick={() => signIn()} color="violet" radius="md" size="lg" mt={32} style={{ marginTop: 32, fontWeight: 700, letterSpacing: 1, fontSize: "1.1rem", padding: "0.75rem 2rem" }}>
            sign in
          </Button>
        )}
      </Stack>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl" style={{ maxWidth: 1200, width: "100%", margin: "0 auto", padding: "0 1rem" }}>
        <Paper withBorder p="xl" radius="lg" style={{ background: "rgba(24, 25, 38, 0.8)", backdropFilter: "blur(8px)", minHeight: 220, display: "flex", flexDirection: "column", alignItems: "flex-start", boxShadow: "0 4px 24px rgba(24, 25, 38, 0.4)", border: "1px solid rgba(179, 186, 255, 0.1)", transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer" }}>
          <Group mb="md">
            <IconWorld size={32} color="#b3baff" />
            <Title order={4} style={{ color: "#b3baff", marginLeft: 8, fontSize: "1.25rem" }}>easy server management</Title>
          </Group>
          <Text size="md" style={{ color: "#ededed", opacity: 0.85, lineHeight: 1.6 }}>
            create and manage minecraft servers with just a few clicks. no technical skills needed—just pick your type and go live!
          </Text>
        </Paper>
        <Paper withBorder p="xl" radius="lg" style={{ background: "rgba(24, 25, 38, 0.8)", backdropFilter: "blur(8px)", minHeight: 220, display: "flex", flexDirection: "column", alignItems: "flex-start", boxShadow: "0 4px 24px rgba(24, 25, 38, 0.4)", border: "1px solid rgba(179, 255, 209, 0.1)", transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer" }}>
          <Group mb="md">
            <IconLock size={32} color="#b3ffd1" />
            <Title order={4} style={{ color: "#b3ffd1", marginLeft: 8, fontSize: "1.25rem" }}>secure & private</Title>
          </Group>
          <Text size="md" style={{ color: "#ededed", opacity: 0.85, lineHeight: 1.6 }}>
            your data and servers are protected with modern authentication and best-in-class security. only you control your servers.
          </Text>
        </Paper>
        <Paper withBorder p="xl" radius="lg" style={{ background: "rgba(24, 25, 38, 0.8)", backdropFilter: "blur(8px)", minHeight: 220, display: "flex", flexDirection: "column", alignItems: "flex-start", boxShadow: "0 4px 24px rgba(24, 25, 38, 0.4)", border: "1px solid rgba(255, 209, 179, 0.1)", transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer" }}>
          <Group mb="md">
            <IconSparkles size={32} color="#ffd1b3" />
            <Title order={4} style={{ color: "#ffd1b3", marginLeft: 8, fontSize: "1.25rem" }}>always improving</Title>
          </Group>
          <Text size="md" style={{ color: "#ededed", opacity: 0.85, lineHeight: 1.6 }}>
            we're constantly adding new features and improvements. have a request? <span style={{ color: "#b3baff" }}>just ask ella!</span>
          </Text>
        </Paper>
      </SimpleGrid>
    </Container>
  );
} 