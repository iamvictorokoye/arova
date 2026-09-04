"use client";

import { useEffect } from "react";
import { PartyPopper } from "lucide-react";

import type { UserProfile } from "@/lib/types";
import { playMatchSound } from "@/lib/sound";
import { useSoundStore } from "@/store/sound-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MatchNotificationProps {
  match: UserProfile;
  open: boolean;
  onClose: () => void;
  onStartChat: () => void;
}

export default function MatchNotification({
  match,
  open,
  onClose,
  onStartChat,
}: MatchNotificationProps) {
  const soundEffectsEnabled = useSoundStore((state) => state.soundEffectsEnabled);

  useEffect(() => {
    if (open && soundEffectsEnabled) playMatchSound();
  }, [open, soundEffectsEnabled]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="text-center">
        <DialogHeader className="items-center">
          <span className="mb-2 flex size-14 items-center justify-center rounded-full brand-gradient text-primary-foreground">
            <PartyPopper className="size-7" />
          </span>
          <DialogTitle className="text-xl">It&rsquo;s a match!</DialogTitle>
          <DialogDescription>
            You and <span className="font-semibold text-foreground">{match.full_name}</span>{" "}
            liked each other.
          </DialogDescription>
        </DialogHeader>

        <Avatar className="mx-auto size-20 border-4 border-background shadow-md">
          <AvatarImage src={match.avatar_url} alt={match.full_name} />
          <AvatarFallback className="text-xl">
            {match.full_name?.[0]?.toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>

        <DialogFooter className="mt-2 sm:justify-center">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Keep swiping
          </Button>
          <Button onClick={onStartChat} className="flex-1">
            Send a message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}