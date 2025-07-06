"use client";
import { Container, Title, Text, Stack, Button, Group, Paper, TextInput, Loader, Modal } from "@mantine/core";
import { useState, useEffect } from "react";
import { IconTrash } from "@tabler/icons-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { redirect, useRouter, useParams } from "next/navigation";

export default function ServerSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [renamed, setRenamed] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeletedPopup, setShowDeletedPopup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/servers/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load server");
        return res.json();
      })
      .then(data => setName(data.name || ""))
      .catch(() => setError("Failed to load server"))
      .finally(() => setLoading(false));
  }, [id]);

  if (status === "loading" || loading) {
    return <Group justify="center" align="center" style={{ minHeight: 300, width: "100%" }}><Loader color="violet" /></Group>;
  }

  if (status === "authenticated" && !session) {
    redirect("/");
  }

  const handleRename = async () => {
    setRenamed(false);
    setError(null);
    try {
      const res = await fetch(`/api/servers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to rename");
      setRenamed(true);
      setTimeout(() => setRenamed(false), 2000);
    } catch {
      setError("Failed to rename server");
    }
  };

  const handleDelete = async () => {
    setDeleted(false);
    setError(null);
    setShowConfirm(false);
    try {
      const res = await fetch(`/api/servers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
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

  return (
    <Container size="sm" py="xl" style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <Stack gap="lg" style={{ width: "100%", maxWidth: 400, margin: "0 auto" }}>
        <Group justify="space-between" align="center">
          <Title order={3} style={{ color: "#b3baff", fontSize: "1.5rem" }}>server settings</Title>
          <Button component={Link} href="../" color="gray" radius="md" size="xs" variant="outline" style={{ textTransform: "lowercase" }}>
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
        <Paper withBorder p="lg" radius="lg" style={{ background: "rgba(35, 36, 58, 0.8)", backdropFilter: "blur(8px)", boxShadow: "0 4px 24px rgba(24, 25, 38, 0.4)", border: "1px solid rgba(255, 179, 179, 0.1)", minHeight: 100, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Text size="sm" style={{ color: "#ffd1b3", opacity: 0.8, marginBottom: 8 }}>danger zone</Text>
          <Button leftSection={<IconTrash size={18} />} color="red" radius="md" size="md" onClick={() => setShowConfirm(true)} style={{ textTransform: "lowercase" }}>delete server</Button>
        </Paper>
        {error && <Text size="xs" style={{ color: "#ffd1b3", marginTop: 8 }}>{error}</Text>}
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