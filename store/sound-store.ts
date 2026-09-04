import { create } from "zustand";
import { persist } from "zustand/middleware";

import { DEFAULT_RINGTONE_ID } from "@/lib/sound";

interface SoundState {
  /** Message send/receive blips, match fanfare, background notifications. */
  soundEffectsEnabled: boolean;
  /** Which ringtone plays for an incoming video call. */
  ringtoneId: string;
  setSoundEffectsEnabled: (enabled: boolean) => void;
  setRingtoneId: (id: string) => void;
}

/**
 * Persisted to localStorage — this is a per-device UI preference, not
 * account data, so it deliberately doesn't live in Supabase.
 */
export const useSoundStore = create<SoundState>()(
  persist(
    (set) => ({
      soundEffectsEnabled: true,
      ringtoneId: DEFAULT_RINGTONE_ID,
      setSoundEffectsEnabled: (enabled) => set({ soundEffectsEnabled: enabled }),
      setRingtoneId: (id) => set({ ringtoneId: id }),
    }),
    { name: "arova-sound-preferences" },
  ),
);