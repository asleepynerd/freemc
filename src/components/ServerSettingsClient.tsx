"use client";
import { Container, Title, Text, Stack, Button, Group, Paper, TextInput, Modal } from "@mantine/core";
import { useState } from "react";
import { IconTrash } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ServerSettingsClientProps {
  id: string;
  serverName: string;
  address: string;
  serverType: number;
}

export default function ServerSettingsClient({ id, serverName, address, serverType }: ServerSettingsClientProps) {
  const [name, setName] = useState(serverName);
  const [renamed, setRenamed] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeletedPopup, setShowDeletedPopup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customAddress, setCustomAddress] = useState(address);
  const [addressSaved, setAddressSaved] = useState(false);
  const [showSRVHelp, setShowSRVHelp] = useState(false);
  const router = useRouter();

  const handleRename = async () => {
    setRenamed(false);
    setError(null);
    try {
      const res = await fetch(`/api/servers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("failed to rename");
      setRenamed(true);
      setTimeout(() => setRenamed(false), 2000);
    } catch {
      setError("failed to rename server");
    }
  };

  const handleAddressSave = async () => {
    setAddressSaved(false);
    setError(null);
    setShowSRVHelp(false);
    try {
      const res = await fetch(`/api/servers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: customAddress }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "failed to save address");
        if (data.error && data.error.includes('SRV record')) {
          setShowSRVHelp(true);
        }
        return;
      }
      setAddressSaved(true);
      setTimeout(() => setAddressSaved(false), 2000);
    } catch (e: any) {
      setError("failed to save address");
    }
  };

  const handleDelete = async () => {
    setDeleted(false);
    setError(null);
    setShowConfirm(false);
    try {
      const res = await fetch(`/api/servers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed to delete");
      setDeleted(true);
      setShowDeletedPopup(true);
      setTimeout(() => {
        setShowDeletedPopup(false);
        router.push("/dashboard");
      }, 1800);
    } catch {
      setError("Failed to delete server");
    }
  };

  const addressSplit = address.split(":");
  const addressIp = addressSplit[0];
  const addressPort = addressSplit[1];

  return (
    <Container size="sm" py="xl" style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <Stack gap="lg" style={{ width: "100%", maxWidth: 400, margin: "0 auto" }}>
        <Group justify="space-between" align="center">
          <Title order={3} style={{ color: "#b3baff", fontSize: "1.5rem" }}>server settings</Title>
          <Button component={Link} href={`/servers/${id}`} color="gray" radius="md" size="xs" variant="outline" style={{ textTransform: "lowercase" }}>
            back
          </Button>
        </Group>
        <Paper withBorder p="lg" radius="lg" style={{ background: "rgba(35, 36, 58, 0.8)", backdropFilter: "blur(8px)", boxShadow: "0 4px 24px rgba(24, 25, 38, 0.4)", border: "1px solid rgba(179, 186, 255, 0.1)", minHeight: 120, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Text size="sm" style={{ color: "#ededed", opacity: 0.8, marginBottom: 8 }}>rename your server</Text>
          <Group gap="xs">
            <TextInput value={name} onChange={e => setName(e.currentTarget.value)} radius="md" size="md" style={{ flex: 1 }} />
            <Button color="violet" radius="md" size="md" onClick={handleRename} style={{ textTransform: "lowercase" }}>rename</Button>
          </Group>
          {renamed && <Text size="xs" style={{ color: "#b3ffd1", marginTop: 8 }}>renamed!</Text>}
        </Paper>
        {error && (
          <Paper withBorder p="md" radius="md" style={{ background: '#2a1a1a', color: '#ffd1b3', marginBottom: 8, zIndex: 1002, position: 'relative', border: '1px solid #ffd1b3' }}>
            <Text size="sm" style={{ color: '#ffd1b3', fontWeight: 600, marginBottom: 2 }}>
              {error.includes('SRV record') ? 'SRV Record Error:' : 'Error:'}
            </Text>
            <Text size="xs" style={{ color: '#ffd1b3', whiteSpace: 'pre-line' }}>
              {error}
            </Text>
          </Paper>
        )}
        {showSRVHelp && (
          <Paper withBorder p="md" radius="md" style={{ background: "rgba(35, 36, 58, 0.7)", marginBottom: 8, zIndex: 1001, position: 'relative' }}>
            <Text size="sm" style={{ color: '#b3ffd1', fontWeight: 600, marginBottom: 4 }}>
              To use a custom domain, create an SRV record for your domain like this:
            </Text>
            <Text size="xs" style={{ color: '#ededed', fontFamily: 'monospace', whiteSpace: 'pre-line', marginBottom: 4 }}>
              {`Service:   _minecraft
Protocol:  _tcp
Name:      <your subdomain>
Priority:  10
Weight:    10
Port:      <your server port>
Target:    <your server IP or hostname>`}
            </Text>
            <Text size="xs" style={{ color: '#b3baff', fontFamily: 'monospace', whiteSpace: 'pre-line' }}>
              {`Example: _minecraft._tcp.mc.example.com SRV 10 10 25565 1.2.3.4`}
            </Text>
            <Text size="xs" style={{ color: '#b3baff', marginTop: 6, opacity: 0.7 }}>
              On some providers, you might have to enter <b>_minecraft._tcp.&lt;name&gt;</b> all in the Name field.
            </Text>
          </Paper>
        )}
        {(serverType === 2 || serverType === 5) && (
          <Paper withBorder p="lg" radius="lg" style={{ background: "rgba(35, 36, 58, 0.8)", backdropFilter: "blur(8px)", boxShadow: "0 4px 24px rgba(24, 25, 38, 0.4)", border: "1px solid rgba(179, 186, 255, 0.1)", minHeight: 120, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <Text size="sm" style={{ color: "#ededed", opacity: 0.8, marginBottom: 8 }}>custom domain/address</Text>
            <Group gap="xs">
              <TextInput value={customAddress} onChange={e => setCustomAddress(e.currentTarget.value)} radius="md" size="md" style={{ flex: 1 }} placeholder="e.g. mc.example.com or 1.2.3.4:25565" />
              <Button color="violet" radius="md" size="md" onClick={handleAddressSave} style={{ textTransform: "lowercase" }}>save</Button>
            </Group>
            {addressSaved && <Text size="xs" style={{ color: "#b3ffd1", marginTop: 8 }}>saved!</Text>}
          </Paper>
        )}
        <Paper withBorder p="lg" radius="lg" style={{ background: "rgba(35, 36, 58, 0.8)", backdropFilter: "blur(8px)", boxShadow: "0 4px 24px rgba(24, 25, 38, 0.4)", border: "1px solid rgba(255, 179, 179, 0.1)", minHeight: 100, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Text size="sm" style={{ color: "#ffd1b3", opacity: 0.8, marginBottom: 8 }}>danger zone</Text>
          <Button leftSection={<IconTrash size={18} />} color="red" radius="md" size="md" onClick={() => setShowConfirm(true)} style={{ textTransform: "lowercase" }}>delete server</Button>
        </Paper>
      </Stack>
      <Modal opened={showConfirm} onClose={() => setShowConfirm(false)} title="are you sure?" centered>
        <Stack gap="md">
          <Text>are you sure you want to delete this server? this action cannot be undone.</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setShowConfirm(false)}>
              cancel
            </Button>
            <Button color="red" onClick={handleDelete}>
              delete
            </Button>
          </Group>
        </Stack>
      </Modal>
      {showDeletedPopup && (
        <div style={{
          position: "fixed",
          top: 32,
          right: 32,
          zIndex: 9999,
          background: "linear-gradient(90deg, #ffb3b3 0%, #ffd1b3 100%)",
          color: "#23243a",
          padding: "18px 32px",
          borderRadius: 16,
          boxShadow: "0 4px 32px rgba(24,25,38,0.18)",
          fontWeight: 700,
          fontSize: "1.1rem",
          letterSpacing: 0.5,
          minWidth: 220,
          textAlign: "center",
          border: "1.5px solid #ffd1b3",
          animation: "fadeInOut 1.8s"
        }}>
          server deleted!
          <style>{`
            @keyframes fadeInOut {
              0% { opacity: 0; transform: translateY(-16px); }
              10% { opacity: 1; transform: translateY(0); }
              90% { opacity: 1; transform: translateY(0); }
              100% { opacity: 0; transform: translateY(-16px); }
            }
          `}</style>
        </div>
      )}
    </Container>
  );
} 