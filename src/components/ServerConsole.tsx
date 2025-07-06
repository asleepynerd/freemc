"use client";
import { useEffect, useRef, useState } from "react";
import useWebSocket from "@/hooks/useWebSocket";
import { Paper, TextInput, Box, Title, Group, Text, Progress } from "@mantine/core";
import AnsiToHtml from "ansi-to-html";

function formatBytes(bytes: number) {
  if (bytes > 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  } else if (bytes > 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  } else if (bytes > 1024) {
    return (bytes / 1024).toFixed(2) + ' KB';
  }
  return bytes + ' B';
}

export function ServerConsole({ serverId }: { serverId: string }) {
  const { isConnected, messages, sendCommand, clearMessages, stats } = useWebSocket(serverId);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const ansiConverter = new AnsiToHtml({ fg: '#e0e0e0', bg: '#181a20', newline: true });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function renderLine(line: string, idx: number) {
    return (
      <div key={idx} style={{ whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: ansiConverter.toHtml(line) }} />
    );
  }

  const handleInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      sendCommand(input);
      setInput("");
    }
  };

  return (
    <Paper
      radius="md"
      p="md"
      style={{
        background: "#23272f",
        color: "#e0e0e0",
        fontFamily: "'Fira Mono', 'Menlo', 'Monaco', 'Consolas', monospace",
        minHeight: 400,
        maxHeight: 600,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 2px 16px 0 rgba(0,0,0,0.7)",
        zIndex: 1,
      }}
    >
      <Title order={3} mb="xs" style={{ color: "#e0e0e0", fontWeight: 600 }}>
        connected to server console
      </Title>
      {stats && (
        <Box mb="md" style={{ background: "#181a20", borderRadius: 6, padding: 12, zIndex: 1 }}>
          <Group gap="md" align="center">
            <Text size="sm" style={{ color: "#ffd700", minWidth: 60 }}>Stats</Text>
            <Text size="sm">CPU: <b>{stats.cpu_absolute.toFixed(2)}%</b></Text>
            <Text size="sm">RAM: <b>{formatBytes(stats.memory_bytes)} / {formatBytes(stats.memory_limit_bytes)}</b></Text>
            <Text size="sm">Disk: <b>{formatBytes(stats.disk_bytes)}</b></Text>
          </Group>
          <Group gap="xs" mt={8}>
            <Text size="xs" style={{ minWidth: 40 }}>CPU</Text>
            <Progress value={stats.cpu_absolute} size="sm" w={120} color="yellow" />
            <Text size="xs" style={{ minWidth: 40 }}>RAM</Text>
            <Progress value={100 * stats.memory_bytes / stats.memory_limit_bytes} size="sm" w={120} color="blue" />
          </Group>
        </Box>
      )}
      <Box
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          marginBottom: 8,
          background: "#181a20",
          borderRadius: 6,
          padding: 8,
          zIndex: 1,
        }}
      >
        {messages.map(renderLine)}
      </Box>
      <TextInput
        placeholder="type a command..."
        value={input}
        onChange={e => setInput(e.currentTarget.value)}
        onKeyDown={handleInput}
        styles={{
          input: {
            background: "#181a20",
            color: "#e0e0e0",
            border: "none",
            fontFamily: "'Fira Mono', monospace",
            zIndex: 1,
          },
        }}
        autoComplete="off"
        spellCheck={false}
      />
    </Paper>
  );
} 