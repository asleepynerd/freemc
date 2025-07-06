"use client"

import { Box, Title, Text, Stack, Button } from "@mantine/core";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { LoginButton } from "@/components/auth";

export default function Home() {
  const { data: session, status } = useSession();
  const loggedIn = !!session?.user;
  return (
    <Box
      style={{
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
        position: "relative",
      }}
    >
      <Stack align="center" justify="center" gap={0}>
        <Title order={1} style={{ fontSize: 54, fontWeight: 800, color: "#b3baff" }}>
          freehost
        </Title>
        <Text size="lg" style={{ color: "#ededed", marginTop: 8, textAlign: "center" }}>
          a place to host your game servers!<br />
          we don't have what you support? just ask ella!
        </Text>
        {loggedIn ? (
          <Button
            component={Link}
            href="/dashboard"
            color="violet"
            radius="md"
            size="lg"
            mt={32}
          >
            go to dashboard
          </Button>
        ) : (
          <LoginButton />
        )}
      </Stack>
    </Box>
  );
}
