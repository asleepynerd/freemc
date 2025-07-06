"use client";
import { useEffect, useState, useRef } from "react";
import { Container, Title, Text, Stack, Button, Group, Paper, TextInput, Progress, Loader } from "@mantine/core";
import Link from "next/link";
import { IconSettings } from "@tabler/icons-react";
import useWebSocket from "@/hooks/useWebSocket";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

function formatBytes(bytes: number) {
  if (bytes > 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  if (bytes > 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  if (bytes > 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return bytes + ' B';
}

function formatUptime(seconds: number) {
  if (!seconds || isNaN(seconds)) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function parseAnsiToHtml(text: string): string {
  const colors: { [key: string]: string } = {
    '30': '#000000', '31': '#ff0000', '32': '#00ff00', '33': '#ffff00',
    '34': '#0000ff', '35': '#ff00ff', '36': '#00ffff', '37': '#ffffff',
    '90': '#808080', '91': '#ff8080', '92': '#80ff80', '93': '#ffff80',
    '94': '#8080ff', '95': '#ff80ff', '96': '#80ffff', '97': '#ffffff'
  };
  const resetCode = '\x1b[0m';
  let result = '';
  let currentColor = '';
  let i = 0;
  while (i < text.length) {
    if (text[i] === '\x1b' && text[i + 1] === '[') {
      let j = i + 2;
      while (j < text.length && text[j] !== 'm') { j++; }
      if (j < text.length) {
        const code = text.substring(i + 2, j);
        const colorCode = code.split(';')[0];
        if (colorCode === '0') {
          if (currentColor) { result += '</span>'; currentColor = ''; }
        } else if (colors[colorCode]) {
          if (currentColor) { result += '</span>'; }
          currentColor = colors[colorCode];
          result += `<span style="color: ${currentColor}">`;
        }
        i = j + 1;
        continue;
      }
    }
    if (text[i] === '<') { result += '&lt;'; }
    else if (text[i] === '>') { result += '&gt;'; }
    else if (text[i] === '&') { result += '&amp;'; }
    else if (text[i] === '\n') { result += '<br>'; }
    else { result += text[i]; }
    i++;
  }
  if (currentColor) { result += '</span>'; }
  return result;
}

export default function ServerDetailClient({ id, initialServer }: { id: string, initialServer: any }) {
  const [server, setServer] = useState<any>(initialServer);
  const [loading, setLoading] = useState(false);
  const [powerLoading, setPowerLoading] = useState(false);
  const [command, setCommand] = useState("");
  const consoleRef = useRef<HTMLDivElement>(null);
  const { isConnected, messages, sendCommand, stats } = useWebSocket(id);
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <Group justify="center" align="center" style={{ minHeight: 300, width: "100%" }}><Loader color="violet" /></Group>;
  }

  if (status === "authenticated" && !session) {
    redirect("/");
  }

  useEffect(() => {
    setLoading(true);
    fetch(`/api/servers/${id}`)
      .then(res => res.json())
      .then(data => setServer(data))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePower = async (action: "start" | "stop" | "restart") => {
    setPowerLoading(true);
    await fetch(`/api/servers/${id}/power`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setPowerLoading(false);
  };

  const handleSendCommand = () => {
    if (command.trim()) {
      sendCommand(command);
      setCommand("");
    }
  };

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [messages]);

  if (loading || !server) {
    return <Group justify="center" align="center" style={{ minHeight: 300 }}><Loader color="violet" /></Group>;
  }

  const uptimeSeconds = stats?.uptime && stats.uptime > 100000 ? Math.floor(stats.uptime / 1000) : stats?.uptime || 0;

  return (
    <Container size="lg" py="xl" style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <Stack gap="lg" style={{ width: "100%", maxWidth: 1100, margin: "0 auto" }}>
        <Group justify="flex-start" align="center">
          <Button component={Link} href="/dashboard" variant="subtle" color="gray" size="xs" radius="md" style={{ textTransform: "lowercase" }}>
            ← back to dashboard
          </Button>
        </Group>
        <Group justify="space-between" align="center">
          <Title
            order={2}
            style={{
              color: "#b3baff",
              fontSize: "2rem",
              position: "relative",
              zIndex: 1000,
            }}
          >
            {server.name}
          </Title>
          <Button component={Link} href={`/servers/${id}/settings`} leftSection={<IconSettings size={18} />} color="gray" radius="md" size="sm" variant="outline" style={{ textTransform: "lowercase" }}>
            settings
          </Button>
        </Group>
        <Paper withBorder p="lg" radius="lg" style={{ background: "rgba(35, 36, 58, 0.8)", backdropFilter: "blur(8px)", boxShadow: "0 4px 24px rgba(24, 25, 38, 0.4)", border: "1px solid rgba(179, 186, 255, 0.1)", minHeight: 120, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Text size="md" style={{ color: "#ededed", opacity: 0.8, marginBottom: 4 }}>
            type: {server.type} | ram: {server.ram}mb | cores: {server.cores} | address: {server.address}
          </Text>
          {stats && (
            <Group gap="md" align="center" style={{ flexWrap: "wrap", marginBottom: 8 }}>
              <Text size="sm" style={{ color: "#b3ffd1" }}>cpu: {stats.cpu_absolute?.toFixed(1)}%</Text>
              <Text size="sm" style={{ color: "#b3ffd1" }}>ram: {formatBytes(stats.memory_bytes)} / {formatBytes(stats.memory_limit_bytes)}</Text>
              <Text size="sm" style={{ color: "#b3ffd1" }}>disk: {formatBytes(stats.disk_bytes)}</Text>
              <Text size="sm" style={{ color: "#b3ffd1" }}>uptime: {formatUptime(uptimeSeconds)}</Text>
            </Group>
          )}
          <Group gap="xs" mt="sm">
            <Button size="xs" color="green" radius="md" style={{ textTransform: "lowercase" }} loading={powerLoading} onClick={() => handlePower("start")}>start</Button>
            <Button size="xs" color="yellow" radius="md" style={{ textTransform: "lowercase" }} loading={powerLoading} onClick={() => handlePower("restart")}>restart</Button>
            <Button size="xs" color="red" radius="md" style={{ textTransform: "lowercase" }} loading={powerLoading} onClick={() => handlePower("stop")}>stop</Button>
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
            minHeight: 400, 
            maxWidth: 1100, 
            width: "100%", 
            display: "flex", 
            flexDirection: "column", 
            justifyContent: "flex-end",
            position: "relative"
          }}
        >
          <Text size="sm" style={{ color: "#b3baff", marginBottom: 8 }}>console</Text>
          <div 
            ref={consoleRef}
            style={{ 
              flex: 1, 
              minHeight: 300, 
              maxHeight: 600, 
              overflowY: "auto", 
              fontFamily: "monospace", 
              fontSize: 14, 
              color: "#ededed", 
              marginBottom: 8, 
              background: "rgba(24, 26, 32, 0.5)", 
              borderRadius: 6, 
              padding: 8,
              lineHeight: 1.4
            }}
          >
            {messages.length === 0 ? (
              <Text size="xs" style={{ color: "#888" }}>no output yet</Text>
            ) : (
              <div dangerouslySetInnerHTML={{ 
                __html: messages.map(line => parseAnsiToHtml(line)).join('<br>') 
              }} />
            )}
          </div>
          <Group gap="xs" mt="xs">
            <TextInput
              value={command}
              onChange={e => setCommand(e.currentTarget.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSendCommand(); }}
              placeholder="type a command..."
              radius="md"
              style={{ flex: 1 }}
            />
            <Button color="violet" radius="md" onClick={handleSendCommand} style={{ textTransform: "lowercase" }}>send</Button>
          </Group>
        </Paper>
      </Stack>
    </Container>
  );
} 