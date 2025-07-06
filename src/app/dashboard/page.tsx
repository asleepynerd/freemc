"use client";
import { useEffect, useState } from "react";
import { Container, Title, Text, Stack, Button, Group, Paper, SimpleGrid, Loader, Modal, Select } from "@mantine/core";
import Link from "next/link";
import { IconPlus, IconLogout } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

const serverTypes = [
  { value: "2", label: "vanilla" },
  //{ value: "3", label: "forge" },
  //{ value: "5", label: "paper" },
];

export default function DashboardPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [type, setType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serversVisible, setServersVisible] = useState(false);
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <Group justify="center" align="center" style={{ minHeight: 300, width: "100%" }}><Loader color="violet" /></Group>;
  }

  if (status === "authenticated" && !session) {
    redirect("/");
  }

  useEffect(() => {
    setLoading(true);
    fetch("/api/servers")
      .then(res => res.json())
      .then(data => setServers(data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && servers.length > 0) {
      const timeout = setTimeout(() => setServersVisible(true), 50);
      return () => clearTimeout(timeout);
    } else if (loading) {
      setServersVisible(false);
    }
  }, [loading, servers.length]);

  const handleCreate = async () => {
    if (!type) return;
    setCreating(true);
    setError(null);
    const res = await fetch("/api/servers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: Number(type) }),
    });
    if (res.ok) {
      setCreateOpen(false);
      setType(null);
      setLoading(true);
      fetch("/api/servers")
        .then(res => res.json())
        .then(data => setServers(data))
        .finally(() => setLoading(false));
    } else {
      const data = await res.json();
      setError(data.error || "failed to create server");
    }
    setCreating(false);
  };

  return (
    <Container size="lg" py="xl" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Paper
        withBorder
        p={{ base: "md", sm: 40 }}
        radius="xl"
        style={{
          width: "100%",
          maxWidth: 700,
          margin: "0 auto",
          background: "rgba(24, 25, 38, 0.85)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 8px 40px 0 rgba(24,25,38,0.25)",
          border: "1.5px solid rgba(179, 186, 255, 0.10)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Group justify="space-between" align="center" style={{ width: "100%", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <Title order={1} style={{ color: "#b3baff", fontSize: "2.4rem", fontWeight: 900, letterSpacing: -1, textTransform: "lowercase" }}>
            your servers
          </Title>
          <Button
            leftSection={<IconPlus size={18} />}
            color="violet"
            radius="md"
            size="md"
            style={{ fontWeight: 700, textTransform: "lowercase", fontSize: "1.1rem", padding: "0.5rem 1.5rem" }}
            onClick={() => setCreateOpen(true)}
          >
            create
          </Button>
        </Group>
        <Text size="md" style={{ color: "#ededed", opacity: 0.85, fontSize: "1.08rem", marginBottom: 24, textAlign: "center" }}>
          manage your servers below.
        </Text>
        {loading ? (
          <Group justify="center" align="center" style={{ minHeight: 200, width: "100%" }}><Loader color="violet" /></Group>
        ) : servers.length === 0 ? (
          <Stack align="center" gap={16} style={{ width: "100%", marginTop: 32 }}>
            <Text size="lg" style={{ color: "#b3baff", fontWeight: 600, fontSize: "1.2rem", textAlign: "center" }}>
              you don't have any servers yet.
            </Text>
            <Button
              color="violet"
              radius="md"
              size="lg"
              style={{ fontWeight: 700, textTransform: "lowercase", fontSize: "1.1rem", padding: "0.75rem 2.5rem" }}
              onClick={() => setCreateOpen(true)}
            >
              create your first server
            </Button>
          </Stack>
        ) : (
          <Stack gap={24} style={{ width: "100%" }}>
            {servers.map((server: any, i: number) => (
              <Paper
                key={server.id}
                withBorder
                p="lg"
                radius="lg"
                component={Link}
                href={`/servers/${server.id}`}
                style={{
                  background: "rgba(35, 36, 58, 0.92)",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 4px 24px rgba(24, 25, 38, 0.18)",
                  border: "1.5px solid rgba(179, 186, 255, 0.13)",
                  minHeight: 120,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "box-shadow 0.18s, transform 0.18s, opacity 0.5s, transform 0.5s",
                  willChange: "transform",
                  position: "relative",
                  zIndex: 1,
                  opacity: serversVisible ? 1 : 0,
                  transform: serversVisible ? 'translateY(0)' : 'translateY(24px)',
                  transitionDelay: serversVisible ? `${i * 60}ms` : '0ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.025)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
              >
                <Title order={4} style={{ color: "#b3baff", fontSize: "1.25rem", marginBottom: 6, fontWeight: 700, textTransform: "lowercase" }}>{server.name}</Title>
                <Text size="sm" style={{ color: "#ededed", opacity: 0.8, marginBottom: 4 }}>
                  type: {server.type} | ram: {server.ram}mb | cores: {server.cores} | address: {server.address}
                </Text>
                <Group gap="xs" mt="sm">
                  <Button size="xs" color="green" radius="md" style={{ textTransform: "lowercase", fontWeight: 600 }}>start</Button>
                  <Button size="xs" color="yellow" radius="md" style={{ textTransform: "lowercase", fontWeight: 600 }}>restart</Button>
                  <Button size="xs" color="red" radius="md" style={{ textTransform: "lowercase", fontWeight: 600 }}>stop</Button>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
        <Modal opened={createOpen} onClose={() => setCreateOpen(false)} title="create a new server" centered>
          <Stack gap="md">
            <Select
              label="server type"
              placeholder="pick one"
              data={serverTypes}
              value={type}
              onChange={setType}
              radius="md"
            />
            <Button color="violet" radius="md" loading={creating} onClick={handleCreate} disabled={!type} style={{ textTransform: "lowercase" }}>
              create
            </Button>
            {error && <Text size="xs" style={{ color: "#ffd1b3" }}>{error}</Text>}
          </Stack>
        </Modal>
      </Paper>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .fade-in {
            opacity: 1;
            transform: translateY(0);
            transition: opacity 0.5s, transform 0.5s;
          }
        }
      `}</style>
    </Container>
  );
} 