"use client";
import { Box, Group, Anchor, Text } from "@mantine/core";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "home :3" },
  { href: "https://github.com/", label: "ooo github!", external: true },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <Box
      component="nav"
      style={{
        width: "100%",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 100,
        background: "rgba(20, 20, 30, 0.85)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid #23243a",
        padding: "0.5rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Text fw={700} size="lg" style={{ letterSpacing: 2, color: "#b3baff" }}>
        /
      </Text>
      <Group gap="lg">
        {links.map(link =>
          link.external ? (
            <Anchor key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" style={{ color: "#e0e0e0", opacity: 0.8, fontWeight: 500, fontSize: 16 }}>
              {link.label}
            </Anchor>
          ) : (
            <Link key={link.href} href={link.href} passHref legacyBehavior>
              <Anchor
                style={{
                  color: pathname === link.href ? "#b3baff" : "#e0e0e0",
                  fontWeight: pathname === link.href ? 700 : 500,
                  fontSize: 16,
                  opacity: pathname === link.href ? 1 : 0.8,
                  textDecoration: "none",
                  transition: "color 0.2s, opacity 0.2s",
                }}
              >
                {link.label}
              </Anchor>
            </Link>
          )
        )}
      </Group>
    </Box>
  );
} 