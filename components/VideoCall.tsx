"use client";

import { useEffect, useState } from "react";
import {
  Call,
  CallControls,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
} from "@stream-io/video-react-sdk";
import { Loader2, PhoneOff } from "lucide-react";

import { getStreamVideoToken } from "@/lib/actions/stream";
import { Button } from "@/components/ui/button";

import "@stream-io/video-react-sdk/dist/css/styles.css";

interface VideoCallProps {
  callId: string;
  onCallEnd: () => void;
  isIncoming?: boolean;
}

export default function VideoCall({
  callId,
  onCallEnd,
  isIncoming = false,
}: VideoCallProps) {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let createdClient: StreamVideoClient | null = null;
    let joinedCall: Call | null = null;

    async function initializeVideoCall() {
      try {
        setError(null);
        const result = await getStreamVideoToken();

        if (!isMounted) return;

        if (!("token" in result) || !result.token || !result.userId) {
          throw new Error("error" in result ? result.error : "Failed to get call token.");
        }
        const { token, userId, userImage, userName } = result;

        const videoClient = new StreamVideoClient({
          apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY!,
          user: { id: userId!, name: userName, image: userImage },
          token,
        });
        createdClient = videoClient;

        const videoCall = videoClient.call("default", callId);
        if (isIncoming) {
          await videoCall.join();
        } else {
          await videoCall.join({ create: true });
        }
        joinedCall = videoCall;

        if (!isMounted) {
          await videoCall.leave().catch(() => {});
          videoClient.disconnectUser();
          return;
        }

        setClient(videoClient);
        setCall(videoCall);
      } catch (err) {
        console.error(err);
        if (isMounted) setError("Failed to start the call.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initializeVideoCall();

    return () => {
      isMounted = false;
      joinedCall?.leave().catch(() => {});
      createdClient?.disconnectUser();
    };
  }, [callId, isIncoming]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="text-center text-white">
          <Loader2 className="mx-auto mb-4 size-12 animate-spin" />
          <p className="text-lg">{isIncoming ? "Joining call..." : "Starting call..."}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="mx-auto max-w-md p-8 text-center text-white">
          <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive">
            <PhoneOff className="size-7" />
          </span>
          <h3 className="mb-2 text-xl font-semibold">Call error</h3>
          <p className="mb-6 text-gray-300">{error}</p>
          <Button onClick={onCallEnd}>Close</Button>
        </div>
      </div>
    );
  }

  if (!client || !call) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="text-center text-white">
          <Loader2 className="mx-auto mb-4 size-12 animate-spin" />
          <p className="text-lg">Setting up call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <StreamTheme>
            <SpeakerLayout />
            <CallControls onLeave={onCallEnd} />
          </StreamTheme>
        </StreamCall>
      </StreamVideo>
    </div>
  );
}
