import "@mantine/core/styles.css";
import { ColorSchemeScript, MantineProvider, AppShell } from "@mantine/core";
import Navigation from "@/components/Navigation";
import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

function AnimatedBackground() {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 0,
      pointerEvents: "none",
      background: "radial-gradient(ellipse at 50% 30%, #23243a 60%, #181926 100%)"
    }} />
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style={{
        minHeight: "100vh",
        background: "#181926",
        color: "#e0e0e0",
        fontFamily: "Inter, sans-serif",
        margin: 0,
        padding: 0,
        position: "relative",
        overflowX: "hidden",
      }}>
        <SessionProvider>
          <MantineProvider defaultColorScheme="dark" forceColorScheme="dark">
            <AnimatedBackground />
            <AppShell header={{ height: 56 }} padding="md">
              <Navigation />
              {children}
            </AppShell>
          </MantineProvider>
        </SessionProvider>
      </body>
    </html>
  );
} 