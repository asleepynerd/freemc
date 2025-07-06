"use client";
import { Box, Tooltip, Stack, ActionIcon } from "@mantine/core";
import { IconHome, IconLayoutDashboard, IconBrandGithub } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", icon: IconHome, label: "home" },
  { href: "/dashboard", icon: IconLayoutDashboard, label: "dashboard" },
  { href: "https://github.com/", icon: IconBrandGithub, label: "github", external: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <Box
      component="aside"
      style={{
        width: 72,
        background: "#181926",
        borderRight: "1px solid #23243a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 16,
        zIndex: 101,
        minHeight: "100vh",
      }}
    >
      <Stack gap={24} align="center">
        {links.map(link => {
          const Icon = link.icon;
          const isActive = !link.external && pathname === link.href;
          return link.external ? (
            <Tooltip label={link.label} position="right" key={link.href}>
              <ActionIcon
                component="a"
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                size={44}
                variant="subtle"
                style={{ color: "#b3baff", opacity: 0.7 }}
              >
                <Icon size={28} />
              </ActionIcon>
            </Tooltip>
          ) : (
            <Tooltip label={link.label} position="right" key={link.href}>
              <ActionIcon
                component={Link}
                href={link.href}
                size={44}
                variant={isActive ? "filled" : "subtle"}
                style={{
                  color: isActive ? "#fff" : "#b3baff",
                  background: isActive ? "#23243a" : "transparent",
                  opacity: isActive ? 1 : 0.7,
                  borderRadius: 16,
                  transition: "background 0.2s, color 0.2s, opacity 0.2s",
                }}
              >
                <Icon size={28} />
              </ActionIcon>
            </Tooltip>
          );
        })}
      </Stack>
    </Box>
  );
} 