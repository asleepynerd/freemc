import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Slack from "next-auth/providers/slack"
import prisma from "./prisma"

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Slack({
      clientId: process.env.SLACK_CLIENT_ID,
      clientSecret: process.env.SLACK_CLIENT_SECRET,
    }),
  ],
  events: {
    async linkAccount({ user, account }) {
      if (account.provider === 'slack') {
        await prisma.user.update({
          where: { id: user.id },
          data: { slackId: account.providerAccountId },
        });
      }
    }
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
}) 