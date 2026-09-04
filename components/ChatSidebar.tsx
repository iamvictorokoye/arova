"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircleHeart, Search } from "lucide-react";

import { useUserMatches } from "@/hooks/use-matches";
import { useConversationPreviews } from "@/hooks/use-conversation-previews";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

function formatPreviewTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffInHours < 48) return "Yesterday";
  if (diffInHours < 24 * 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatBadgeCount(count: number) {
  return count > 9 ? "9+" : String(count);
}

export default function ChatSidebar({
  activeUserId,
  className,
}: {
  activeUserId?: string;
  className?: string;
}) {
  const { data: matches = [], isLoading, isError, refetch } = useUserMatches();
  const { previews } = useConversationPreviews();
  const [search, setSearch] = useState("");

  const conversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return matches
      .filter(
        (match) =>
          !query ||
          match.full_name.toLowerCase().includes(query) ||
          match.username.toLowerCase().includes(query),
      )
      .map((match) => {
        const preview = previews[match.id];
        return {
          match,
          preview,
          sortKey: preview?.lastMessageAt ?? match.created_at,
        };
      })
      .sort((a, b) => new Date(b.sortKey).getTime() - new Date(a.sortKey).getTime());
  }, [matches, previews, search]);

  return (
    <div className={cn("flex h-full flex-col bg-card", className)}>
      <div className="border-b border-border p-4">
        <h1 className="mb-3 text-xl font-bold tracking-tight">Messages</h1>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations"
            className="rounded-full pl-9"
          />
        </div>
      </div>

      <div className="thin-scrollbar flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-1 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="size-12 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-sm text-muted-foreground">Failed to load conversations.</p>
            <Button size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <span className="flex size-16 items-center justify-center rounded-full brand-gradient text-primary-foreground">
              <MessageCircleHeart className="size-7" />
            </span>
            <div>
              <p className="font-semibold">
                {search ? "No conversations found" : "No conversations yet"}
              </p>
              {!search && (
                <p className="text-sm text-muted-foreground">Match with someone to start chatting.</p>
              )}
            </div>
          </div>
        ) : (
          <ul>
            {conversations.map(({ match, preview }) => {
              const isActive = match.id === activeUserId;
              const unread = preview?.unreadCount ?? 0;

              return (
                <li key={match.id}>
                  <Link
                    href={`/chat/${match.id}`}
                    className={cn(
                      "flex items-center gap-3 border-b border-border/50 px-4 py-3 transition-colors hover:bg-accent/50",
                      isActive && "bg-accent",
                    )}
                  >
                    <Avatar className="size-12 shrink-0">
                      <AvatarImage src={match.avatar_url} alt={match.full_name} />
                      <AvatarFallback>{match.full_name?.[0]?.toUpperCase() ?? "?"}</AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className={cn("truncate text-sm", unread > 0 ? "font-bold" : "font-semibold")}>
                          {match.full_name}
                        </h3>
                        <span
                          className={cn(
                            "shrink-0 text-xs",
                            unread > 0 ? "font-semibold text-primary" : "text-muted-foreground",
                          )}
                        >
                          {formatPreviewTime(preview?.lastMessageAt ?? match.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            "truncate text-sm",
                            unread > 0 ? "font-medium text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {preview?.lastMessageText || "Start your conversation!"}
                        </p>
                        {unread > 0 && (
                          <Badge
                            variant="destructive"
                            className="h-5 min-w-5 shrink-0 justify-center rounded-full px-1.5"
                          >
                            {formatBadgeCount(unread)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}