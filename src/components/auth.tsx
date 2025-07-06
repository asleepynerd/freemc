"use client"
import { signIn, signOut } from "next-auth/react"
import { Button } from "@mantine/core"

export const LoginButton = () => {
  return <Button onClick={() => signIn("slack")}>Login with Slack</Button>
}

export const LogoutButton = () => {
  return <Button onClick={() => signOut()}>Logout</Button>
} 