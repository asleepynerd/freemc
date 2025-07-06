"use client";
import { Box, Group, Text, Avatar } from "@mantine/core";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

function getTitle(pathname: string) {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/servers/")) return "server console";
  return "freehost";
}

export default function Topbar() {
  const session = useSession();
  const pathname = usePathname();
  const title = getTitle(pathname);
  return (
    <Box
      component="header"
      style={{
        width: "100%",
        height: 56,
        background: "rgba(20, 20, 30, 0.85)",
        borderBottom: "1px solid #23243a",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2rem",
        zIndex: 102,
      }}
    >
      <Text fw={700} size="xl" style={{ color: "#b3baff", letterSpacing: 1 }}>{title}</Text>
      <Group>
        <Avatar radius="xl" size={36} color="violet">
          {session.data?.user?.name?.charAt(0)}
        </Avatar>
      </Group>
    </Box>
  );
} 