import { create } from "zustand";

interface IncomingCall {
  callId: string;
  callerName: string;
}

interface CallState {
  /** Video call currently shown full-screen, if any. */
  activeCallId: string | null;
  isCallInitiator: boolean;
  /** A ringing call waiting for the user to accept/decline. */
  incomingCall: IncomingCall | null;

  startOutgoingCall: (callId: string) => void;
  receiveIncomingCall: (call: IncomingCall) => void;
  acceptIncomingCall: () => void;
  declineIncomingCall: () => void;
  endCall: () => void;
}

/**
 * Shared across ChatHeader (which triggers calls) and
 * StreamChatInterface/VideoCall (which need to react to them), so an
 * incoming-call toast/dialog can be driven from one place regardless of
 * which component currently has focus.
 */
export const useCallStore = create<CallState>((set) => ({
  activeCallId: null,
  isCallInitiator: false,
  incomingCall: null,

  startOutgoingCall: (callId) =>
    set({ activeCallId: callId, isCallInitiator: true, incomingCall: null }),

  receiveIncomingCall: (call) => set({ incomingCall: call }),

  acceptIncomingCall: () =>
    set((state) => ({
      activeCallId: state.incomingCall?.callId ?? null,
      isCallInitiator: false,
      incomingCall: null,
    })),

  declineIncomingCall: () => set({ incomingCall: null }),

  endCall: () =>
    set({ activeCallId: null, isCallInitiator: false, incomingCall: null }),
}));
