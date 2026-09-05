export default function OfflinePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-2xl font-semibold">You&apos;re offline</h1>
      <p className="text-sm text-muted-foreground">
        Check your connection and try again — chat and video calls need an active connection.
      </p>
    </div>
  );
}