"use client";

import Link from "next/link";
import { ArrowRight, Heart, MessageCircle, Video } from "lucide-react";

import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Heart,
    title: "Smart matching",
    description: "Swipe through profiles picked for your preferences.",
  },
  {
    icon: MessageCircle,
    title: "Real-time chat",
    description: "Message your matches instantly, no delays.",
  },
  {
    icon: Video,
    title: "Live video calls",
    description: "Go from chatting to a face-to-face call in one tap.",
  },
];

export default function Home() {
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-linear-to-br from-rose-50 via-background to-purple-50 dark:from-background dark:via-background dark:to-background">
      <section className="container mx-auto px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-foreground lg:text-7xl">
            Find your perfect
            <span className="block brand-gradient-text">Arova match</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground lg:text-xl">
            Connect with like-minded people through real conversations, live
            video, and matches that actually fit what you&rsquo;re looking for.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            {!initialized ? null : user ? (
              <>
                <Button asChild size="lg">
                  <Link href="/matches">
                    Start discovering
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/profile">View profile</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link href="/auth">
                    Get started
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/auth">Sign in</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mx-auto mt-20 grid max-w-4xl gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border/60 bg-card/70 p-6 text-center shadow-sm backdrop-blur"
            >
              <span className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full brand-gradient text-primary-foreground">
                <feature.icon className="size-5" />
              </span>
              <h3 className="mb-1 font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
