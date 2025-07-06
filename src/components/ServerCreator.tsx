"use client";

import { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Modal, Button, Select, Stack, LoadingOverlay, Title, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';

const serverTypes = [
  { value: '2', label: 'vanilla (4gb ram, 2 cores)' },
  { value: '3', label: 'forge (6gb ram, 4 cores)' },
  { value: '5', label: 'paper (4gb ram, 4 cores)' },
];

export function ServerCreator() {
  const [opened, { open, close }] = useDisclosure(false);
  const [serverType, setServerType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!serverType) {
      notifications.show({
        title: 'error',
        message: 'please select a server type.',
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: parseInt(serverType, 10) }),
      });

      const data = await response.json();

      if (response.ok) {
        notifications.show({
          title: 'success',
          message: 'server created successfully!',
          color: 'green',
        });
        router.refresh();
        close();
      } else {
        notifications.show({
          title: 'error',
          message: data.error || 'failed to create server.',
          color: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'error',
        message: 'an unexpected error occurred.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        title={<Title order={4} style={{ color: "#b3baff" }}>create a new server</Title>}
        centered
        overlayProps={{ backgroundOpacity: 0.7, blur: 2 }}
        radius="lg"
        size="sm"
        styles={{
          content: { background: "#23243a", color: "#ededed" },
        }}
      >
        <LoadingOverlay visible={loading} />
        <Stack gap="md">
          <Text size="md" style={{ color: "#ededed", opacity: 0.8 }}>
            select a server type to create your new server.
          </Text>
          <Select
            label="server type"
            placeholder="pick a server type"
            data={serverTypes}
            value={serverType}
            onChange={setServerType}
            required
            styles={{
              input: { background: "#181926", color: "#ededed" },
              label: { color: "#b3baff" },
            }}
          />
          <Button onClick={handleSubmit} color="violet" radius="md" size="md">
            create server
          </Button>
        </Stack>
      </Modal>

      <Button onClick={open} color="violet" radius="md" size="md">
        create new server
      </Button>
    </>
  );
} 