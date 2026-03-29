"use client";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL as string);
export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider appearance={{ variables: { colorPrimary: "#C9A84C", colorBackground: "#111111", colorInputBackground: "#1A1A1A", colorText: "#F5F5F5" } }}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>{children}</ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
