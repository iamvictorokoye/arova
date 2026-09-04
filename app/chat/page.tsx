"use client";

import { MessageCircle } from "lucide-react";

import ChatSidebar from "@/components/ChatSidebar";

export default function ChatPage() {
  return (
    <>
      {/* Mobile: the list is the whole page. Desktop already has it via
          the persistent sidebar in app/chat/layout.tsx, so it's hidden
          here to avoid rendering it twice. */}
      <ChatSidebar className="flex-1 md:hidden" />

      <div className="hidden flex-1 flex-col items-center justify-center gap-3 bg-muted/30 text-center md:flex">
        <span className="flex size-16 items-center justify-center rounded-full brand-gradient text-primary-foreground">
          <MessageCircle className="size-7" />
        </span>
        <div>
          <p className="font-semibold">Select a conversation</p>
          <p className="text-sm text-muted-foreground">
            Pick someone from the list to start chatting.
          </p>
        </div>
      </div>
    </>
  );
}