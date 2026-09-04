"use client";

import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { ChatNotificationsProvider } from "@/providers/chat-notifications-provider";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <ChatNotificationsProvider>
          {children}
          <Toaster />
        </ChatNotificationsProvider>
      </AuthProvider>
    </QueryProvider>
  );
}