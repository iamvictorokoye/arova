"use client";

import { PlayCircle, Volume2 } from "lucide-react";

import { RINGTONES, previewRingtone } from "@/lib/sound";
import { useSoundStore } from "@/store/sound-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function NotificationSoundSettings() {
  const soundEffectsEnabled = useSoundStore((state) => state.soundEffectsEnabled);
  const ringtoneId = useSoundStore((state) => state.ringtoneId);
  const setSoundEffectsEnabled = useSoundStore((state) => state.setSoundEffectsEnabled);
  const setRingtoneId = useSoundStore((state) => state.setRingtoneId);

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-2 font-semibold">
          <Volume2 className="size-4" />
          Notification sounds
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Message sounds</p>
            <p className="text-xs text-muted-foreground">
              Play a sound when messages are sent or received
            </p>
          </div>
          <Switch
            checked={soundEffectsEnabled}
            onCheckedChange={setSoundEffectsEnabled}
            aria-label="Toggle message sounds"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Video call ringtone</p>
          <div className="flex gap-2">
            <Select value={ringtoneId} onValueChange={setRingtoneId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Choose a ringtone" />
              </SelectTrigger>
              <SelectContent>
                {RINGTONES.map((ringtone) => (
                  <SelectItem key={ringtone.id} value={ringtone.id}>
                    {ringtone.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => previewRingtone(ringtoneId)}
              title="Preview ringtone"
            >
              <PlayCircle />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}