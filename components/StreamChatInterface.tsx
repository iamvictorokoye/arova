"use client";

import {
  RefObject,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowDown, Check, CheckCheck, Send } from "lucide-react";
import { Channel, Event, StreamChat } from "stream-chat";

import { createOrGetChannel, createVideoCall, getStreamUserToken } from "@/lib/actions/stream";
import { cn } from "@/lib/utils";
import { playReceiveSound, playSendSound } from "@/lib/sound";
import type { ChatMessage, UserProfile } from "@/lib/types";
import { useCallStore } from "@/store/call-store";
import { useSoundStore } from "@/store/sound-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import IncomingCallDialog from "@/components/IncomingCallDialog";
import VideoCall from "@/components/VideoCall";

const GROUP_GAP_MS = 5 * 60 * 1000;

type ChatListItem =
  | { type: "divider"; id: string; label: string }
  | { type: "group"; id: string; sender: "me" | "other"; messages: ChatMessage[] };

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateDivider(date: Date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function buildChatItems(messages: ChatMessage[]): ChatListItem[] {
  const items: ChatListItem[] = [];
  let lastDate: Date | null = null;

  for (const message of messages) {
    if (!lastDate || !isSameDay(lastDate, message.timestamp)) {
      items.push({
        type: "divider",
        id: `divider-${message.id}`,
        label: formatDateDivider(message.timestamp),
      });
    }
    lastDate = message.timestamp;

    const lastItem = items[items.length - 1];
    const prevGroup = lastItem?.type === "group" ? lastItem : null;
    const prevMessage = prevGroup?.messages[prevGroup.messages.length - 1];
    const withinGap =
      prevMessage &&
      message.timestamp.getTime() - prevMessage.timestamp.getTime() < GROUP_GAP_MS;

    if (prevGroup && prevGroup.sender === message.sender && withinGap) {
      prevGroup.messages.push(message);
    } else {
      items.push({
        type: "group",
        id: `group-${message.id}`,
        sender: message.sender,
        messages: [message],
      });
    }
  }

  return items;
}

export default function StreamChatInterface({
  otherUser,
  ref,
}: {
  otherUser: UserProfile;
  ref: RefObject<{ handleVideoCall: () => void } | null>;
}) {
  const [currentUserId, setCurrentUserId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserLastRead, setOtherUserLastRead] = useState<Date | null>(null);

  const [client, setClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const activeCallId = useCallStore((state) => state.activeCallId);
  const isCallInitiator = useCallStore((state) => state.isCallInitiator);
  const startOutgoingCall = useCallStore((state) => state.startOutgoingCall);
  const receiveIncomingCall = useCallStore((state) => state.receiveIncomingCall);
  const endCall = useCallStore((state) => state.endCall);

  const soundEffectsEnabled = useSoundStore((state) => state.soundEffectsEnabled);
  const soundEnabledRef = useRef(soundEffectsEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEffectsEnabled;
  }, [soundEffectsEnabled]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);

  const chatItems = useMemo(() => buildChatItems(messages), [messages]);

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setShowScrollButton(false);
  }

  useEffect(() => {
    if (messages.length === 0) return;

    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      scrollToBottom("auto");
      requestAnimationFrame(() => scrollToBottom("auto"));
    } else {
      scrollToBottom("smooth");
    }
  }, [messages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    function handleScroll() {
      if (!container) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
    }

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    endCall();
    setConnectionError(null);

    let cancelled = false;
    let activeChannel: Channel | null = null;
    let handleMessageNew: ((event: Event) => void) | null = null;
    let handleTypingStart: ((event: Event) => void) | null = null;
    let handleTypingStop: ((event: Event) => void) | null = null;
    let handleMessageRead: ((event: Event) => void) | null = null;

    async function initializeChat() {
      try {
        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
        if (!apiKey) throw new Error("Stream API key is not configured.");

        const result = await getStreamUserToken();
        if (!("token" in result) || !result.token || !result.userId) {
          throw new Error("error" in result ? result.error : "Failed to get chat token.");
        }
        const { token, userId, userName, userImage } = result;
        if (cancelled) return;
        setCurrentUserId(userId);

        const chatClient = StreamChat.getInstance(apiKey);
        if (!chatClient.userID) {
          await chatClient.connectUser({ id: userId, name: userName, image: userImage }, token);
        }
        if (cancelled) return;

        const { channelType, channelId } = await createOrGetChannel(otherUser.id);
        if (!channelType || !channelId) throw new Error("Failed to open conversation.");

        const chatChannel = chatClient.channel(channelType, channelId);
        await chatChannel.watch();
        if (cancelled) {
          chatChannel.stopWatching().catch(() => {});
          return;
        }
        activeChannel = chatChannel;

        const state = await chatChannel.query({ messages: { limit: 50 } });
        const convertedMessages: ChatMessage[] = state.messages.map((msg) => ({
          id: msg.id,
          text: msg.text || "",
          sender: msg.user?.id === userId ? "me" : "other",
          timestamp: new Date(msg.created_at || new Date()),
          user_id: msg.user?.id || "",
        }));
        setMessages(convertedMessages);

        const otherRead = chatChannel.state.read[otherUser.id];
        if (otherRead?.last_read) setOtherUserLastRead(new Date(otherRead.last_read));

        await chatChannel.markRead().catch(() => {});

        handleMessageNew = (event: Event) => {
          if (!event.message) return;

          if (event.message.text?.includes("📹 Video call invitation")) {
            const customData = event.message as unknown as {
              call_id: string;
              caller_id: string;
              caller_name?: string;
            };
            if (customData.caller_id !== userId) {
              receiveIncomingCall({
                callId: customData.call_id,
                callerName: customData.caller_name || otherUser.full_name || "Someone",
              });
            }
            return;
          }

          if (event.message.user?.id !== userId) {
            const newMsg: ChatMessage = {
              id: event.message.id,
              text: event.message.text || "",
              sender: "other",
              timestamp: new Date(event.message.created_at || new Date()),
              user_id: event.message.user?.id || "",
            };
            setMessages((prev) =>
              prev.some((msg) => msg.id === newMsg.id) ? prev : [...prev, newMsg],
            );
            if (soundEnabledRef.current) playReceiveSound();
            chatChannel.markRead().catch(() => {});
          }
        };

        handleTypingStart = (event: Event) => {
          if (event.user?.id !== userId) setIsTyping(true);
        };
        handleTypingStop = (event: Event) => {
          if (event.user?.id !== userId) setIsTyping(false);
        };
        handleMessageRead = (event: Event) => {
          if (event.user?.id === otherUser.id) setOtherUserLastRead(new Date());
        };

        chatChannel.on("message.new", handleMessageNew);
        chatChannel.on("typing.start", handleTypingStart);
        chatChannel.on("typing.stop", handleTypingStop);
        chatChannel.on("message.read", handleMessageRead);

        setClient(chatClient);
        setChannel(chatChannel);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setConnectionError(
            error instanceof Error ? error.message : "Failed to connect to chat.",
          );
        }
      }
    }

    if (otherUser) initializeChat();

    return () => {
      cancelled = true;
      if (activeChannel) {
        if (handleMessageNew) activeChannel.off("message.new", handleMessageNew);
        if (handleTypingStart) activeChannel.off("typing.start", handleTypingStart);
        if (handleTypingStop) activeChannel.off("typing.stop", handleTypingStop);
        if (handleMessageRead) activeChannel.off("message.read", handleMessageRead);
        activeChannel.stopWatching().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherUser, retryKey]);

  async function handleVideoCall() {
    try {
      const { callId } = await createVideoCall(otherUser.id);
      startOutgoingCall(callId!);

      if (channel) {
        await channel.sendMessage({
          text: `📹 Video call invitation`,
          // Custom fields read back out in the message.new handler above.
          ...({
            call_id: callId,
            caller_id: currentUserId,
            caller_name: otherUser.full_name || "Someone",
          } as Record<string, unknown>),
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  useImperativeHandle(ref, () => ({ handleVideoCall }));

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !channel) return;

    try {
      const response = await channel.sendMessage({ text: newMessage.trim() });
      const message: ChatMessage = {
        id: response.message.id,
        text: newMessage.trim(),
        sender: "me",
        timestamp: new Date(),
        user_id: currentUserId,
      };
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      setNewMessage("");
      if (soundEffectsEnabled) playSendSound();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  if (connectionError) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background px-4">
        <div className="max-w-sm text-center">
          <p className="mb-1 font-semibold">Couldn&rsquo;t connect to chat</p>
          <p className="mb-4 text-sm text-muted-foreground">{connectionError}</p>
          <Button onClick={() => setRetryKey((key) => key + 1)}>Try again</Button>
        </div>
      </div>
    );
  }

  if (!client || !channel) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto size-10 animate-spin rounded-full border-b-2 border-primary" />
          <p className="mt-4 text-muted-foreground">Setting up chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-wallpaper flex h-full flex-col">
      <div
        ref={messagesContainerRef}
        className="thin-scrollbar relative flex-1 space-y-1 overflow-y-auto p-4"
      >
        {chatItems.map((item) => {
          if (item.type === "divider") {
            return (
              <div key={item.id} className="flex justify-center py-2">
                <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                  {item.label}
                </span>
              </div>
            );
          }

          const isMe = item.sender === "me";
          const lastMessage = item.messages[item.messages.length - 1];
          const isSeen = isMe && !!otherUserLastRead && lastMessage.timestamp <= otherUserLastRead;

          return (
            <div key={item.id} className={cn("mb-3 flex gap-2", isMe ? "justify-end" : "justify-start")}>
              {!isMe && (
                <Avatar className="size-7 self-end">
                  <AvatarImage src={otherUser.avatar_url} alt={otherUser.full_name} />
                  <AvatarFallback className="text-[10px]">
                    {otherUser.full_name?.[0]?.toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={cn("flex max-w-[75%] flex-col gap-0.5 lg:max-w-md", isMe ? "items-end" : "items-start")}>
                {item.messages.map((message, index) => {
                  const isFirst = index === 0;
                  const isLast = index === item.messages.length - 1;

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm",
                        isMe ? "brand-gradient text-primary-foreground" : "bg-background text-foreground",
                        isMe && !isFirst && "rounded-tr-md",
                        isMe && !isLast && "rounded-br-md",
                        !isMe && !isFirst && "rounded-tl-md",
                        !isMe && !isLast && "rounded-bl-md",
                      )}
                    >
                      {message.text}
                    </div>
                  );
                })}

                <div className="flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
                  <span>{formatTime(lastMessage.timestamp)}</span>
                  {isMe &&
                    (isSeen ? (
                      <CheckCheck className="size-3.5 text-primary" />
                    ) : (
                      <Check className="size-3.5" />
                    ))}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-end gap-2">
            <Avatar className="size-7">
              <AvatarImage src={otherUser.avatar_url} alt={otherUser.full_name} />
              <AvatarFallback className="text-[10px]">
                {otherUser.full_name?.[0]?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div className="rounded-2xl rounded-bl-md bg-background px-4 py-2.5 shadow-sm">
              <div className="flex gap-1">
                <div className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
                <div className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.1s]" />
                <div className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {showScrollButton && (
        <div className="absolute bottom-20 right-6 z-10">
          <Button size="icon" onClick={() => scrollToBottom("smooth")} className="shadow-lg">
            <ArrowDown />
          </Button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-border bg-background p-4">
        <Input
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            if (channel && e.target.value.length > 0) channel.keystroke();
          }}
          onFocus={() => channel?.keystroke()}
          placeholder="Type a message..."
          className="flex-1 rounded-full"
          disabled={!channel}
        />
        <Button type="submit" size="icon" disabled={!newMessage.trim() || !channel}>
          <Send />
        </Button>
      </form>

      <IncomingCallDialog caller={otherUser} />

      {activeCallId && (
        <VideoCall
          callId={activeCallId}
          isIncoming={!isCallInitiator}
          onCallEnd={endCall}
        />
      )}
    </div>
  );
}