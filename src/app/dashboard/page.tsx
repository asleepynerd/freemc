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
  { value: "5", label: "paper" },
  { value: "23", label: "factorio" },
  { value: "24", label: "terraria" },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [type, setType] = useState<string | null>(null);
  const [version, setVersion] = useState<string>("latest");
  const [error, setError] = useState<string | null>(null);
  const [serversVisible, setServersVisible] = useState(false);

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
      body: JSON.stringify({ type: Number(type), version }),
    });
    if (res.ok) {
      setCreateOpen(false);
      setType(null);
      setVersion("latest");
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

  if (status === "loading") {
    return <Group justify="center" align="center" style={{ minHeight: 300, width: "100%" }}><Loader color="violet" /></Group>;
  }

  if (status === "authenticated" && !session) {
    redirect("/");
  }

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
                  <Button size="xs" color="violet" radius="md" style={{ textTransform: "lowercase", fontWeight: 600 }} component={Link} href={`/servers/${server.id}/files`}>files</Button>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
        <Modal opened={createOpen} onClose={() => { setCreateOpen(false); setType(null); setVersion("latest"); }} title="create a new server" centered>
          <Stack gap="md">
            <Select
              label="server type"
              placeholder="pick one"
              data={serverTypes}
              value={type}
              onChange={setType}
              radius="md"
            />
            {(type === "2" || type === "5") && (
              <Select
                label="minecraft version"
                placeholder="select version"
                data={[
                  { value: "latest", label: "latest" },
                  { value: "1.21.7", label: "1.21.7" },
                  { value: "1.21.6", label: "1.21.6" },
                  { value: "1.21.5", label: "1.21.5" },
                  { value: "1.21.4", label: "1.21.4" },
                  { value: "1.21.3", label: "1.21.3" },
                  { value: "1.21.1", label: "1.21.1" },
                  { value: "1.21", label: "1.21" },
                  { value: "1.20.6", label: "1.20.6" },
                  { value: "1.20.4", label: "1.20.4" },
                  { value: "1.20.2", label: "1.20.2" },
                  { value: "1.20.1", label: "1.20.1" },
                  { value: "1.19.4", label: "1.19.4" },
                  { value: "1.19.2", label: "1.19.2" },
                  { value: "1.18.2", label: "1.18.2" },
                  { value: "1.17.1", label: "1.17.1" },
                  { value: "1.16.5", label: "1.16.5" },
                ]}
                value={version}
                onChange={(value) => setVersion(value || "latest")}
                radius="md"
              />
            )}
            {type === "23" && (
              <Select
                label="factorio version"
                placeholder="select version"
                data={[
                  { value: 'latest', label: 'latest' },
                  { value: '2.0.58', label: '2.0.58' },
                  { value: '2.0.57', label: '2.0.57' },
                  { value: '2.0.56', label: '2.0.56' },
                  { value: '2.0.55', label: '2.0.55' },
                  { value: '2.0.54', label: '2.0.54' },
                  { value: '2.0.53', label: '2.0.53' },
                  { value: '2.0.52', label: '2.0.52' },
                  { value: '2.0.51', label: '2.0.51' },
                  { value: '2.0.50', label: '2.0.50' },
                  { value: '2.0.49', label: '2.0.49' },
                  { value: '2.0.48', label: '2.0.48' },
                  { value: '2.0.47', label: '2.0.47' },
                  { value: '2.0.46', label: '2.0.46' },
                  { value: '2.0.45', label: '2.0.45' },
                  { value: '2.0.44', label: '2.0.44' },
                  { value: '2.0.43', label: '2.0.43' },
                  { value: '2.0.42', label: '2.0.42' },
                  { value: '2.0.41', label: '2.0.41' },
                  { value: '2.0.40', label: '2.0.40' },
                  { value: '2.0.39', label: '2.0.39' },
                  { value: '2.0.38', label: '2.0.38' },
                  { value: '2.0.37', label: '2.0.37' },
                  { value: '2.0.36', label: '2.0.36' },
                  { value: '2.0.35', label: '2.0.35' },
                  { value: '2.0.34', label: '2.0.34' },
                  { value: '2.0.33', label: '2.0.33' },
                  { value: '2.0.32', label: '2.0.32' },
                  { value: '2.0.31', label: '2.0.31' },
                  { value: '2.0.30', label: '2.0.30' },
                  { value: '2.0.29', label: '2.0.29' },
                  { value: '2.0.28', label: '2.0.28' },
                  { value: '2.0.27', label: '2.0.27' },
                  { value: '2.0.26', label: '2.0.26' },
                  { value: '2.0.25', label: '2.0.25' },
                  { value: '2.0.24', label: '2.0.24' },
                  { value: '2.0.23', label: '2.0.23' },
                  { value: '2.0.22', label: '2.0.22' },
                  { value: '2.0.21', label: '2.0.21' },
                  { value: '2.0.20', label: '2.0.20' },
                  { value: '2.0.19', label: '2.0.19' },
                  { value: '2.0.18', label: '2.0.18' },
                  { value: '2.0.17', label: '2.0.17' },
                  { value: '2.0.16', label: '2.0.16' },
                  { value: '2.0.15', label: '2.0.15' },
                  { value: '2.0.14', label: '2.0.14' },
                  { value: '2.0.13', label: '2.0.13' },
                  { value: '2.0.12', label: '2.0.12' },
                  { value: '2.0.11', label: '2.0.11' },
                  { value: '2.0.10', label: '2.0.10' },
                  { value: '2.0.9', label: '2.0.9' },
                  { value: '2.0.8', label: '2.0.8' },
                  { value: '2.0.7', label: '2.0.7' },
                  { value: '2.0.0', label: '2.0.0' },
                  { value: '1.1.110', label: '1.1.110' },
                  { value: '1.1.109', label: '1.1.109' },
                  { value: '1.1.108', label: '1.1.108' },
                  { value: '1.1.107', label: '1.1.107' },
                  { value: '1.1.106', label: '1.1.106' },
                  { value: '1.1.105', label: '1.1.105' },
                  { value: '1.1.104', label: '1.1.104' },
                  { value: '1.1.103', label: '1.1.103' },
                  { value: '1.1.102', label: '1.1.102' },
                  { value: '1.1.101', label: '1.1.101' },
                  { value: '1.1.100', label: '1.1.100' },
                  { value: '1.1.99', label: '1.1.99' },
                  { value: '1.1.98', label: '1.1.98' },
                  { value: '1.1.97', label: '1.1.97' },
                  { value: '1.1.96', label: '1.1.96' },
                  { value: '1.1.95', label: '1.1.95' },
                  { value: '1.1.94', label: '1.1.94' },
                  { value: '1.1.93', label: '1.1.93' },
                  { value: '1.1.92', label: '1.1.92' },
                  { value: '1.1.91', label: '1.1.91' },
                  { value: '1.1.90', label: '1.1.90' },
                  { value: '1.1.89', label: '1.1.89' },
                  { value: '1.1.88', label: '1.1.88' },
                  { value: '1.1.87', label: '1.1.87' },
                  { value: '1.1.86', label: '1.1.86' },
                  { value: '1.1.85', label: '1.1.85' },
                  { value: '1.1.84', label: '1.1.84' },
                  { value: '1.1.83', label: '1.1.83' },
                  { value: '1.1.82', label: '1.1.82' },
                  { value: '1.1.81', label: '1.1.81' },
                  { value: '1.1.80', label: '1.1.80' },
                  { value: '1.1.79', label: '1.1.79' },
                  { value: '1.1.78', label: '1.1.78' },
                  { value: '1.1.77', label: '1.1.77' },
                  { value: '1.1.76', label: '1.1.76' },
                  { value: '1.1.75', label: '1.1.75' },
                  { value: '1.1.74', label: '1.1.74' },
                  { value: '1.1.73', label: '1.1.73' },
                  { value: '1.1.72', label: '1.1.72' },
                  { value: '1.1.71', label: '1.1.71' },
                  { value: '1.1.70', label: '1.1.70' },
                  { value: '1.1.69', label: '1.1.69' },
                  { value: '1.1.68', label: '1.1.68' },
                  { value: '1.1.67', label: '1.1.67' },
                  { value: '1.1.66', label: '1.1.66' },
                  { value: '1.1.65', label: '1.1.65' },
                  { value: '1.1.64', label: '1.1.64' },
                  { value: '1.1.63', label: '1.1.63' },
                  { value: '1.1.62', label: '1.1.62' },
                  { value: '1.1.61', label: '1.1.61' },
                  { value: '1.1.60', label: '1.1.60' },
                  { value: '1.1.59', label: '1.1.59' },
                  { value: '1.1.58', label: '1.1.58' },
                  { value: '1.1.57', label: '1.1.57' },
                  { value: '1.1.56', label: '1.1.56' },
                  { value: '1.1.55', label: '1.1.55' },
                  { value: '1.1.54', label: '1.1.54' },
                  { value: '1.1.53', label: '1.1.53' },
                  { value: '1.1.52', label: '1.1.52' },
                  { value: '1.1.51', label: '1.1.51' },
                  { value: '1.1.50', label: '1.1.50' },
                  { value: '1.1.49', label: '1.1.49' },
                  { value: '1.1.48', label: '1.1.48' },
                  { value: '1.1.47', label: '1.1.47' },
                  { value: '1.1.46', label: '1.1.46' },
                  { value: '1.1.45', label: '1.1.45' },
                  { value: '1.1.44', label: '1.1.44' },
                  { value: '1.1.43', label: '1.1.43' },
                  { value: '1.1.42', label: '1.1.42' },
                  { value: '1.1.41', label: '1.1.41' },
                  { value: '1.1.40', label: '1.1.40' },
                  { value: '1.1.39', label: '1.1.39' },
                  { value: '1.1.38', label: '1.1.38' },
                  { value: '1.1.37', label: '1.1.37' },
                  { value: '1.1.36', label: '1.1.36' },
                  { value: '1.1.35', label: '1.1.35' },
                  { value: '1.1.34', label: '1.1.34' },
                  { value: '1.1.33', label: '1.1.33' },
                  { value: '1.1.32', label: '1.1.32' },
                  { value: '1.1.31', label: '1.1.31' },
                  { value: '1.1.30', label: '1.1.30' },
                  { value: '1.1.29', label: '1.1.29' },
                  { value: '1.1.28', label: '1.1.28' },
                  { value: '1.1.27', label: '1.1.27' },
                  { value: '1.1.26', label: '1.1.26' },
                  { value: '1.1.25', label: '1.1.25' },
                  { value: '1.1.24', label: '1.1.24' },
                  { value: '1.1.23', label: '1.1.23' },
                  { value: '1.1.22', label: '1.1.22' },
                  { value: '1.1.21', label: '1.1.21' },
                  { value: '1.1.20', label: '1.1.20' },
                  { value: '1.1.19', label: '1.1.19' },
                  { value: '1.1.18', label: '1.1.18' },
                  { value: '1.1.17', label: '1.1.17' },
                  { value: '1.1.16', label: '1.1.16' },
                  { value: '1.1.15', label: '1.1.15' },
                  { value: '1.1.14', label: '1.1.14' },
                  { value: '1.1.13', label: '1.1.13' },
                  { value: '1.1.12', label: '1.1.12' },
                  { value: '1.1.11', label: '1.1.11' },
                  { value: '1.1.10', label: '1.1.10' },
                  { value: '1.1.9', label: '1.1.9' },
                  { value: '1.1.8', label: '1.1.8' },
                  { value: '1.1.7', label: '1.1.7' },
                  { value: '1.1.6', label: '1.1.6' },
                  { value: '1.1.5', label: '1.1.5' },
                  { value: '1.1.4', label: '1.1.4' },
                  { value: '1.1.3', label: '1.1.3' },
                  { value: '1.1.2', label: '1.1.2' },
                  { value: '1.1.1', label: '1.1.1' },
                  { value: '1.1.0', label: '1.1.0' },
                ]}
                value={version}
                onChange={(value) => setVersion(value || "latest")}
                allowDeselect={false}
                required
              />
            )}
            {type === "24" && (
              <Select
                label="terraria version"
                placeholder="select version"
                data={[
                  { value: 'latest', label: 'latest' },
                  { value: '1.4.0.5', label: '1.4.0.5' },
                  { value: '1.4.0.4', label: '1.4.0.4' },
                  { value: '1.4.0.3', label: '1.4.0.3' },
                  { value: '1.4.0.1', label: '1.4.0.1' },
                  { value: '1.3.5.3', label: '1.3.5.3' },
                  { value: '1.3.5.2', label: '1.3.5.2' },
                  { value: '1.3.5.1', label: '1.3.5.1' },
                  { value: '1.3.5', label: '1.3.5' },
                  { value: '1.3.4.3', label: '1.3.4.3' },
                  { value: '1.3.4.1', label: '1.3.4.1' },
                  { value: '1.3.4', label: '1.3.4' },
                  { value: '1.3.3.3', label: '1.3.3.3' },
                  { value: '1.3.3', label: '1.3.3' },
                  { value: '1.3.2.1', label: '1.3.2.1' },
                  { value: '1.3.2', label: '1.3.2' },
                  { value: '1.3.1.1', label: '1.3.1.1' },
                  { value: '1.3.1', label: '1.3.1' },
                  { value: '1.3.0.8', label: '1.3.0.8' },
                  { value: '1.3.0.7', label: '1.3.0.7' },
                  { value: '1.3.0.6', label: '1.3.0.6' },
                ]}
                value={version}
                onChange={(value) => setVersion(value || "latest")}
                radius="md"
              />
            )}
            
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