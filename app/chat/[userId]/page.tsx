"use client";

import { useRef, use as usePromise } from "react";
import { useRouter } from "next/navigation";

import ChatHeader from "@/components/ChatHeader";
import StreamChatInterface from "@/components/StreamChatInterface";
import { useUserMatches } from "@/hooks/use-matches";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatConversationPageProps {
  params: Promise<{ userId: string }>;
}

export default function ChatConversationPage({ params }: ChatConversationPageProps) {
  const { userId } = usePromise(params);
  const { data: matches = [], isLoading, isError, refetch } = useUserMatches();
  const chatInterfaceRef = useRef<{ handleVideoCall: () => void }>(null);
  const router = useRouter();

  const otherUser = matches.find((match) => match.id === userId);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <Skeleton className="h-16 w-full rounded-none" />
        <div className="flex-1 space-y-4 p-4">
          <Skeleton className="h-16 w-2/3 rounded-2xl" />
          <Skeleton className="ml-auto h-16 w-2/3 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !otherUser) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <h2 className="mb-2 text-xl font-semibold">Conversation not found</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              This match may no longer be available.
            </p>
            <Button onClick={() => (isError ? refetch() : router.push("/chat"))}>
              {isError ? "Try again" : "Go back"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <ChatHeader
        user={otherUser}
        onVideoCall={() => chatInterfaceRef.current?.handleVideoCall()}
      />
      <div className="min-h-0 flex-1">
        <StreamChatInterface otherUser={otherUser} ref={chatInterfaceRef} />
      </div>
    </div>
  );
}