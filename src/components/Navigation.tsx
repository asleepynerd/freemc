"use client";
import { AppShell, Container, Group, Text, ActionIcon, Burger, Drawer, Stack, Avatar, Menu, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { IconHome, IconLayoutDashboard, IconBrandGithub } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";

const navLinks = [
  { href: "/", icon: IconHome, label: "home" },
  { href: "/dashboard", icon: IconLayoutDashboard, label: "dashboard" },
  { href: "https://github.com/", icon: IconBrandGithub, label: "github", external: true },
];

export default function Navigation() {
  const pathname = usePathname();
  const [opened, { open, close }] = useDisclosure(false);
  const { data: session, status } = useSession();

  return (
    <>
      <AppShell.Header style={{
        background: "rgba(24, 25, 38, 0.85)",
        borderBottom: "1px solid #23243a",
        backdropFilter: "blur(12px)",
        zIndex: 100,
        position: "relative"
      }}>
        <Container size="lg" px="md" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <Group gap="xs" align="center">
            <Text component={Link} href="/" fw={900} size="xl" style={{ color: "#b3baff", textDecoration: "none", fontFamily: "inherit", letterSpacing: -1 }}>
              freehost
            </Text>
          </Group>
          <Group gap="md" visibleFrom="sm">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = !link.external && pathname === link.href;
              return link.external ? (
                <ActionIcon
                  key={link.href}
                  component="a"
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  size={36}
                  variant="subtle"
                  style={{ color: "#b3baff", opacity: 0.7 }}
                >
                  <Icon size={22} /> {link.label}
                </ActionIcon>
              ) : (
                <ActionIcon
                  key={link.href}
                  component={Link}
                  href={link.href}
                  size={36}
                  variant={isActive ? "filled" : "subtle"}
                  style={{
                    color: isActive ? "#fff" : "#b3baff",
                    background: isActive ? "#23243a" : "transparent",
                    opacity: isActive ? 1 : 0.7,
                    borderRadius: 12,
                    transition: "background 0.2s, color 0.2s, opacity 0.2s",
                  }}
                >
                  <Icon size={22} /> {link.label}
                </ActionIcon>
              );
            })}
            {session && session.user ? (
              <Menu shadow="md" width={180} position="bottom-end">
                <Menu.Target>
                  <Group gap={8} style={{ cursor: "pointer" }}>
                    <Avatar src={session.user.image} alt={session.user.name || "user"} radius="xl" size={36} />
                    <Text size="sm" style={{ color: "#b3baff", fontWeight: 600, textTransform: "lowercase" }}>
                      {session.user.name || session.user.email?.split("@")[0] || "user"}
                    </Text>
                  </Group>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item onClick={() => signOut({ callbackUrl: "/" })}>
                    sign out
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <Button color="violet" radius="md" size="sm" style={{ fontWeight: 600, letterSpacing: 0.5 }} onClick={() => signIn()}>sign in</Button>
            )}
          </Group>
          <Burger opened={opened} onClick={open} hiddenFrom="sm" aria-label="open navigation" />
        </Container>
      </AppShell.Header>
      <Drawer opened={opened} onClose={close} padding="md" size="xs" title="navigate" hiddenFrom="sm">
        <Stack gap="md">
          {navLinks.map(link => {
            const Icon = link.icon;
            return link.external ? (
              <ActionIcon
                key={link.href}
                component="a"
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                size={40}
                variant="subtle"
                style={{ color: "#b3baff", opacity: 0.7 }}
              >
                <Icon size={24} />
              </ActionIcon>
            ) : (
              <ActionIcon
                key={link.href}
                component={Link}
                href={link.href}
                size={40}
                variant={pathname === link.href ? "filled" : "subtle"}
                style={{
                  color: pathname === link.href ? "#fff" : "#b3baff",
                  background: pathname === link.href ? "#23243a" : "transparent",
                  opacity: pathname === link.href ? 1 : 0.7,
                  borderRadius: 12,
                  transition: "background 0.2s, color 0.2s, opacity 0.2s",
                }}
                onClick={close}
              >
                <Icon size={24} />
              </ActionIcon>
            );
          })}
        </Stack>
      </Drawer>
    </>
  );
} 