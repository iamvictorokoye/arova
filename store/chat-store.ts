import { create } from "zustand";

interface ChatNotificationsState {
  /** Total unread messages across every conversation, from Stream's own count. */
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

/**
 * Purely for the badge on the "Messages" nav link. The actual message data
 * lives in Stream; this just mirrors the number so the Navbar (which is
 * mounted on every page) can render it without needing its own Stream
 * connection.
 */
export const useChatNotificationsStore = create<ChatNotificationsState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
}));