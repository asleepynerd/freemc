import ServerDetailClient from "@/components/ServerDetailClient";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { app, client, ipMappings } from "@/lib/pterodactyl";
import { IconFolder } from "@tabler/icons-react";
import Link from "next/link";

export default async function ServerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/");
  }
  
  const server = await prisma.server.findUnique({ where: { id } });
  
  if (!server) {
    return notFound();
  }
  
  if (server.userId !== session.user.id) {
    return notFound();
  }
  
  const pteroServer = await client.servers.getDetails(server.pterodactylServerId.toString());
  const allocation = await client.network.listAllocations(server.pterodactylServerId.toString());
  const ip = ipMappings[allocation.data[0].attributes.ip as keyof typeof ipMappings];
  const port = allocation.data[0].attributes.port;
  const serverData = {
    name: pteroServer.attributes.name,
    type: server.type,
    ram: server.ram,
    cores: server.cores,
    address: server.address || `${ip}:${port}`
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href={`/servers/${id}/files`} passHref legacyBehavior>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(179,186,255,0.08)', border: '1px solid #b3baff', color: '#b3baff', borderRadius: 8, padding: '6px 14px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', marginRight: 8 }}>
              <IconFolder size={18} style={{ marginRight: 4 }} />
              file manager
            </button>
          </Link>
          <Link href={`/servers/${id}/settings`} passHref legacyBehavior>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(179,186,255,0.08)', border: '1px solid #b3baff', color: '#b3baff', borderRadius: 8, padding: '6px 14px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b3baff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 5 15.4a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 5 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09c0 .66.42 1.24 1 1.51a1.65 1.65 0 0 0 1.82.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.39.39-.51.98-.33 1.82.18.84.98 1.51 1.82 1.51H21a2 2 0 1 1 0 4h-.09c-.66 0-1.24.42-1.51 1z"/></svg>
              settings
            </button>
          </Link>
        </div>
      </div>
      <ServerDetailClient id={id} initialServer={serverData} />
    </div>
  );
} 