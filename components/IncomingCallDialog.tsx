"use client";

import { useEffect } from "react";
import { Phone, PhoneOff } from "lucide-react";

import { useCallStore } from "@/store/call-store";
import { useSoundStore } from "@/store/sound-store";
import { startRingtone, stopRingtone } from "@/lib/sound";
import type { UserProfile } from "@/lib/types";
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

/**
 * Renders the "someone is calling you" prompt whenever the shared
 * call-store has a ringing call, regardless of which chat is on screen.
 */
export default function IncomingCallDialog({ caller }: { caller: UserProfile }) {
  const incomingCall = useCallStore((state) => state.incomingCall);
  const acceptIncomingCall = useCallStore((state) => state.acceptIncomingCall);
  const declineIncomingCall = useCallStore((state) => state.declineIncomingCall);
  const ringtoneId = useSoundStore((state) => state.ringtoneId);
  const soundEffectsEnabled = useSoundStore((state) => state.soundEffectsEnabled);

  useEffect(() => {
    if (incomingCall && soundEffectsEnabled) {
      startRingtone(ringtoneId);
    } else {
      stopRingtone();
    }

    return () => stopRingtone();
  }, [incomingCall, ringtoneId, soundEffectsEnabled]);

  return (
    <Dialog open={!!incomingCall} onOpenChange={(next) => !next && declineIncomingCall()}>
      <DialogContent className="text-center" showCloseButton={false}>
        <DialogHeader className="items-center">
          <Avatar className="mx-auto mb-2 size-20 border-4 border-primary/40 shadow-md">
            <AvatarImage src={caller.avatar_url} alt={caller.full_name} />
            <AvatarFallback className="text-xl">
              {caller.full_name?.[0]?.toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          <DialogTitle className="text-xl">Incoming video call</DialogTitle>
          <DialogDescription>
            {incomingCall?.callerName ?? caller.full_name} is calling you
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:justify-center">
          <Button
            variant="outline"
            className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
            onClick={declineIncomingCall}
          >
            <PhoneOff />
            Decline
          </Button>
          <Button
            className="flex-1 bg-success text-success-foreground hover:bg-success/90"
            onClick={acceptIncomingCall}
          >
            <Phone />
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}