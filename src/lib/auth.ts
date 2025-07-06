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
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'slack' && profile) {
        const updateData: any = {};
        const image =
          (profile.image as string) ||
          (profile.image_512 as string) ||
          (profile.image_192 as string) ||
          (profile.picture as string);
        if (typeof image === 'string' && image) updateData.image = image;
        if (typeof profile.name === 'string' && profile.name) updateData.name = profile.name;
        if (typeof profile.email === 'string' && profile.email) updateData.email = profile.email;
        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });
        }
      }
    },
    async signOut(event) {
      const sessionToken =
        'token' in event && event.token?.sessionToken
          ? event.token.sessionToken
          : 'session' in event && event.session?.sessionToken
          ? event.session.sessionToken
          : null;
      if (sessionToken) {
        await prisma.session.deleteMany({ where: { sessionToken } });
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