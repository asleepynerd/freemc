import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import MeClient from "@/components/MeClient";
import { Container } from "@mantine/core";

export default async function MePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    redirect("/");
  }

  return (
    <Container size="md" py="xl">
      <MeClient user={user} />
    </Container>
  );
} 