"use client";
import dynamic from "next/dynamic";
const ServerConsole = dynamic(() => import("./ServerConsole").then(m => m.ServerConsole), { ssr: false });

export default function ServerConsoleClientWrapper({ serverId }: { serverId: string }) {
  return <ServerConsole serverId={serverId} />;
} 