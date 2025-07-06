"use client";
import { Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";

export function ServerPowerButtons({ serverId }: { serverId: string }) {
  const router = useRouter();

  const handleAction = async (action: "start" | "stop" | "restart") => {
    const res = await fetch(`/api/servers/${serverId}/power`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      notifications.show({ title: 'success', message: `server ${action}ed!`, color: 'green' });
    } else {
      const data = await res.json();
      notifications.show({ title: 'error', message: data.error || `failed to ${action} server.`, color: 'red' });
    }
  };

  const handleDelete = async () => {
    if (!confirm("are you sure you want to delete this server? this cannot be undone.")) return;
    const res = await fetch(`/api/servers/${serverId}`, { method: "DELETE" });
    if (res.ok) {
      notifications.show({ title: 'success', message: 'server deleted!', color: 'green' });
      router.refresh();
    } else {
      const data = await res.json();
      notifications.show({ title: 'error', message: data.error || 'failed to delete server.', color: 'red' });
    }
  };

  return (
    <Group mt="md">
      <Button size="xs" color="green" onClick={() => handleAction("start")}>start</Button>
      <Button size="xs" color="yellow" onClick={() => handleAction("restart")}>restart</Button>
      <Button size="xs" color="red" onClick={() => handleAction("stop")}>stop</Button>
      <Button size="xs" color="gray" variant="outline" onClick={handleDelete}>delete</Button>
    </Group>
  );
} 