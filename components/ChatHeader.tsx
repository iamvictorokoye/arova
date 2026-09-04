"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Video } from "lucide-react";

import { calculateAge } from "@/lib/helpers/calculate-age";
import type { UserProfile } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  user: UserProfile;
  onVideoCall?: () => void;
}

export default function ChatHeader({ user, onVideoCall }: ChatHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/chat")} className="md:hidden">
          <ArrowLeft />
        </Button>

        <div className="relative">
          <Avatar className="size-11">
            <AvatarImage src={user.avatar_url} alt={user.full_name} />
            <AvatarFallback>{user.full_name?.[0]?.toUpperCase() ?? "?"}</AvatarFallback>
          </Avatar>
          <span className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-card bg-success" />
        </div>

        <div className="min-w-0">
          <h2 className="truncate font-semibold">
            {user.full_name}, {calculateAge(user.birthdate)}
          </h2>
          <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
        </div>
      </div>

      <Button
        onClick={onVideoCall}
        size="icon"
        className="shrink-0 brand-gradient text-primary-foreground shadow-md"
        title="Start video call"
      >
        <Video />
      </Button>
    </div>
  );
}