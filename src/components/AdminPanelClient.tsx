"use client";
import { 
  Container, 
  Title, 
  Text, 
  Stack, 
  Button, 
  Group, 
  Paper, 
  Table, 
  Badge, 
  Modal, 
  TextInput, 
  NumberInput,
  Switch,
  Tabs,
  Avatar,
  ActionIcon,
  Tooltip,
  ScrollArea
} from "@mantine/core";
import { useState } from "react";
import { 
  IconUsers, 
  IconServer, 
  IconEdit, 
  IconTrash, 
  IconEye,
  IconSettings,
  IconShield,
  IconDatabase
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function MBToGB(mb: number) {
  return mb / 1024;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  admin: boolean;
  verified: boolean;
  limit: number;
  createdAt: Date;
  servers: Array<{
    id: string;
    pterodactylServerId: string;
    type: number;
    ram: number;
    cores: number;
    address: string | null;
    createdAt: Date;
  }>;
}

interface Server {
  id: string;
  pterodactylServerId: string;
  type: number;
  ram: number;
  cores: number;
  address: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface AdminPanelClientProps {
  users: User[];
  servers: Server[];
}

const serverTypes = {
  2: "Vanilla",
  5: "Paper",
};

export default function AdminPanelClient({ users, servers }: AdminPanelClientProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    limit: 1,
    admin: false,
    verified: false
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("users");
  const router = useRouter();

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      limit: user.limit,
      admin: user.admin,
      verified: user.verified
    });
    setError(null);
    setSuccess(null);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "failed to update user");
      }

      setSuccess("user updated successfully!");
      setTimeout(() => {
        setEditingUser(null);
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("are you sure you want to delete this user? this will also delete all their servers.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete user");
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const totalUsers = users.length;
  const totalServers = servers.length;
  const adminUsers = users.filter(u => u.admin).length;
  const totalRam = servers.reduce((sum, s) => sum + s.ram, 0);
  const totalCores = servers.reduce((sum, s) => sum + s.cores, 0);

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={1} style={{ color: "#b3baff", fontSize: "2.4rem", fontWeight: 900, letterSpacing: -1, textTransform: "lowercase" }}>
            admin panel
          </Title>
          <Button component={Link} href="/dashboard" color="gray" radius="md" size="sm" variant="outline">
            back to dashboard
          </Button>
        </Group>

        <Group grow>
          <Paper withBorder p="md" radius="md" style={{ background: "rgba(35, 36, 58, 0.8)", textAlign: "center", position: "relative" }}>
            <IconUsers size={32} style={{ color: "#b3baff", margin: "0 auto 8px" }} />
            <div style={{ 
              color: "#ededed", 
              fontSize: "20px", 
              fontWeight: "700", 
              lineHeight: "1.3",
              margin: "4px 0",
              position: "relative",
              zIndex: 10,
              display: "block",
              visibility: "visible"
            }}>{totalUsers}</div>
            <div style={{ 
              color: "#ededed", 
              fontSize: "14px", 
              opacity: "0.7",
              position: "relative",
              zIndex: 10,
              display: "block",
              visibility: "visible"
            }}>users</div>
          </Paper>
          <Paper withBorder p="md" radius="md" style={{ background: "rgba(35, 36, 58, 0.8)", textAlign: "center", position: "relative" }}>
            <IconServer size={32} style={{ color: "#b3baff", margin: "0 auto 8px" }} />
            <div style={{ 
              color: "#ededed", 
              fontSize: "20px", 
              fontWeight: "700", 
              lineHeight: "1.3",
              margin: "4px 0",
              position: "relative",
              zIndex: 10,
              display: "block",
              visibility: "visible"
            }}>{totalServers}</div>
            <div style={{ 
              color: "#ededed", 
              fontSize: "14px", 
              opacity: "0.7",
              position: "relative",
              zIndex: 10,
              display: "block",
              visibility: "visible"
            }}>servers</div>
          </Paper>
          <Paper withBorder p="md" radius="md" style={{ background: "rgba(35, 36, 58, 0.8)", textAlign: "center", position: "relative" }}>
            <IconShield size={32} style={{ color: "#b3baff", margin: "0 auto 8px" }} />
            <div style={{ 
              color: "#ededed", 
              fontSize: "20px", 
              fontWeight: "700", 
              lineHeight: "1.3",
              margin: "4px 0",
              position: "relative",
              zIndex: 10,
              display: "block",
              visibility: "visible"
            }}>{adminUsers}</div>
            <div style={{ 
              color: "#ededed", 
              fontSize: "14px", 
              opacity: "0.7",
              position: "relative",
              zIndex: 10,
              display: "block",
              visibility: "visible"
            }}>admins</div>
          </Paper>
          <Paper withBorder p="md" radius="md" style={{ background: "rgba(35, 36, 58, 0.8)", textAlign: "center", position: "relative" }}>
            <IconDatabase size={32} style={{ color: "#b3baff", margin: "0 auto 8px" }} />
            <div style={{ 
              color: "#ededed", 
              fontSize: "20px", 
              fontWeight: "700", 
              lineHeight: "1.3",
              margin: "4px 0",
              position: "relative",
              zIndex: 10,
              display: "block",
              visibility: "visible"
            }}>{MBToGB(totalRam)}GB</div>
            <div style={{ 
              color: "#ededed", 
              fontSize: "14px", 
              opacity: "0.7",
              position: "relative",
              zIndex: 10,
              display: "block",
              visibility: "visible"
            }}>ram</div>
          </Paper>
        </Group>

        {error && (
          <Paper withBorder p="md" radius="md" style={{ background: '#2a1a1a', color: '#ffd1b3', border: '1px solid #ffd1b3' }}>
            <Text size="sm" style={{ color: '#ffd1b3' }}>{error}</Text>
          </Paper>
        )}

        {success && (
          <Paper withBorder p="md" radius="md" style={{ background: '#1a2a1a', color: '#b3ffd1', border: '1px solid #b3ffd1' }}>
            <Text size="sm" style={{ color: '#b3ffd1' }}>{success}</Text>
          </Paper>
        )}

        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || "users")}>
          <Tabs.List>
            <Tabs.Tab value="users" leftSection={<IconUsers size={16} />}>
              users
            </Tabs.Tab>
            <Tabs.Tab value="servers" leftSection={<IconServer size={16} />}>
              servers
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="users" pt="md">
            <Paper withBorder p="md" radius="md" style={{ background: "rgba(35, 36, 58, 0.8)" }}>
              <ScrollArea>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ color: "#b3baff" }}>user</Table.Th>
                      <Table.Th style={{ color: "#b3baff" }}>email</Table.Th>
                      <Table.Th style={{ color: "#b3baff" }}>servers</Table.Th>
                      <Table.Th style={{ color: "#b3baff" }}>limit</Table.Th>
                      <Table.Th style={{ color: "#b3baff" }}>status</Table.Th>
                      <Table.Th style={{ color: "#b3baff" }}>created</Table.Th>
                      <Table.Th style={{ color: "#b3baff" }}>actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {users.map((user) => (
                      <Table.Tr key={user.id}>
                        <Table.Td>
                          <Group gap="sm">
                            <Avatar size="sm" />
                            <div>
                              <Text size="sm" style={{ color: "#ededed" }}>
                                {user.name || "Unknown"}
                              </Text>
                              {user.admin && (
                                <Badge size="xs" color="red" variant="filled">admin</Badge>
                              )}
                            </div>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" style={{ color: "#ededed" }}>
                            {user.email || "no email"}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" style={{ color: "#ededed" }}>
                            {user.servers.length}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" style={{ color: "#ededed" }}>
                            {user.limit}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            {user.verified ? (
                              <Badge size="xs" color="green" variant="filled">verified</Badge>
                            ) : (
                              <Badge size="xs" color="gray" variant="filled">unverified</Badge>
                            )}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" style={{ color: "#ededed", opacity: 0.7 }}>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Tooltip label="edit user">
                              <ActionIcon
                                size="sm"
                                color="blue"
                                variant="light"
                                onClick={() => handleEditUser(user)}
                              >
                                <IconEdit size={14} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="delete user">
                              <ActionIcon
                                size="sm"
                                color="red"
                                variant="light"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="servers" pt="md">
            <Paper withBorder p="md" radius="md" style={{ background: "rgba(35, 36, 58, 0.8)" }}>
              <ScrollArea>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ color: "#b3baff" }}>server id</Table.Th>
                      <Table.Th style={{ color: "#b3baff" }}>owner</Table.Th>
                      <Table.Th style={{ color: "#b3baff" }}>type</Table.Th>
                      <Table.Th style={{ color: "#b3baff" }}>resources</Table.Th>
                      <Table.Th style={{ color: "#b3baff" }}>address</Table.Th>
                      <Table.Th style={{ color: "#b3baff" }}>created</Table.Th>
                      <Table.Th style={{ color: "#b3baff" }}>actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {servers.map((server) => (
                      <Table.Tr key={server.id}>
                        <Table.Td>
                          <Text size="sm" style={{ color: "#ededed", fontFamily: "monospace" }}>
                            {server.id.slice(0, 8)}...
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <div>
                            <Text size="sm" style={{ color: "#ededed" }}>
                              {server.user.name || "Unknown"}
                            </Text>
                            <Text size="xs" style={{ color: "#ededed", opacity: 0.7 }}>
                              {server.user.email}
                            </Text>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <Badge color="violet" variant="light">
                            {serverTypes[server.type as keyof typeof serverTypes] || "Unknown"}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" style={{ color: "#ededed" }}>
                            {MBToGB(server.ram)}GB ram, {server.cores} cores
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" style={{ color: "#ededed", fontFamily: "monospace" }}>
                            {server.address || "No custom address"}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" style={{ color: "#ededed", opacity: 0.7 }}>
                            {new Date(server.createdAt).toLocaleDateString()}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Tooltip label="view server">
                              <ActionIcon
                                size="sm"
                                color="blue"
                                variant="light"
                                component={Link}
                                href={`/servers/${server.id}`}
                              >
                                <IconEye size={14} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="server settings">
                              <ActionIcon
                                size="sm"
                                color="gray"
                                variant="light"
                                component={Link}
                                href={`/servers/${server.id}/settings`}
                              >
                                <IconSettings size={14} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Paper>
          </Tabs.Panel>
        </Tabs>
      </Stack>

      <Modal
        opened={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="edit user"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.currentTarget.value })}
          />
          <TextInput
            label="email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.currentTarget.value })}
          />
          <NumberInput
            label="server limit"
            value={editForm.limit}
            onChange={(val) => setEditForm({ ...editForm, limit: Number(val) || 0 })}
            min={0}
            max={50}
          />
          <Switch
            label="admin"
            checked={editForm.admin}
            onChange={(e) => setEditForm({ ...editForm, admin: e.currentTarget.checked })}
          />
          <Switch
            label="verified"
            checked={editForm.verified}
            onChange={(e) => setEditForm({ ...editForm, verified: e.currentTarget.checked })}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setEditingUser(null)}>
              cancel
            </Button>
            <Button color="violet" onClick={handleSaveUser}>
              save
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
} 