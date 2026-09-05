"use client";

import { usePathname } from "next/navigation";

import ChatSidebar from "@/components/ChatSidebar";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeUserId = pathname.match(/^\/chat\/(.+)$/)?.[1];

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-1 overflow-hidden">
      <aside className="hidden w-full max-w-sm shrink-0 border-r border-border md:flex">
        <ChatSidebar activeUserId={activeUserId} className="w-full" />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}