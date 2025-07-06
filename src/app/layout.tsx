import "@mantine/core/styles.css";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import type { Metadata } from "next";
import AnimatedBackground from "@/components/AnimatedBackground";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Providers from "@/components/Providers";


export const metadata: Metadata = {
  title: "freehost",
  description: "a place to host your game servers!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 30%, #23243a 60%, #181926 100%)",
        color: "#e0e0e0",
        fontFamily: "Inter, sans-serif",
        margin: 0,
        padding: 0,
        position: "relative",
      }}>
        <MantineProvider defaultColorScheme="dark">
          <Providers>
            <AnimatedBackground />
            <div style={{ display: "flex", minHeight: "100vh" }}>
              <Sidebar />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
                <Topbar />
                <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "2rem 0 0 0" }}>
                  {children}
                </main>
              </div>
            </div>
          </Providers>
        </MantineProvider>
      </body>
    </html>
  );
}
