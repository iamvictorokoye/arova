"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Heart, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import MatchButtons from "@/components/MatchButtons";
import MatchCard from "@/components/MatchCard";
import MatchNotification from "@/components/MatchNotification";
import { useLikeUser, usePotentialMatches } from "@/hooks/use-matches";
import type { UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function MatchesPage() {
  const { data: potentialMatches = [], isLoading } = usePotentialMatches();
  // console.log("potentialMatches: ", potentialMatches);
  const { mutate: likeUser, isPending: isLiking } = useLikeUser();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchedUser, setMatchedUser] = useState<UserProfile | null>(null);

  const router = useRouter();

  function handleLike() {
    if (currentIndex >= potentialMatches.length) return;
    const likedUser = potentialMatches[currentIndex];

    likeUser(likedUser.id, {
      onSuccess: (result) => {
        if (result.isMatch && result.matchedUser) {
          setMatchedUser(result.matchedUser);
        }
        setCurrentIndex((prev) => prev + 1);
      },
      onError: () => toast.error("Couldn't process that like, try again."),
    });
  }

  function handlePass() {
    if (currentIndex < potentialMatches.length) {
      setCurrentIndex((prev) => prev + 1);
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto flex-1 px-4 py-10">
        <Skeleton className="mx-auto mb-8 h-8 w-56" />
        <Skeleton className="mx-auto aspect-3/4 max-w-sm rounded-3xl" />
      </div>
    );
  }

  const noMoreProfiles = currentIndex >= potentialMatches.length;
  const currentPotentialMatch = potentialMatches[currentIndex];

  return (
    <div className="flex-1 bg-linear-to-br from-rose-50 via-background to-purple-50 dark:from-background dark:via-background dark:to-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft />
          </Button>

          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Discover matches</h1>
            <p className="text-muted-foreground">
              {noMoreProfiles
                ? "You're all caught up"
                : `${currentIndex + 1} of ${potentialMatches.length} profiles`}
            </p>
          </div>
        </header>

        {noMoreProfiles ? (
          <div className="mx-auto max-w-md p-8 text-center">
            <span className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full brand-gradient text-primary-foreground">
              <Heart className="size-10" />
            </span>
            <h2 className="mb-4 text-2xl font-bold">No more profiles to show</h2>
            <p className="mb-6 text-muted-foreground">
              Check back later for new matches, or refresh to see everyone again.
            </p>
            <Button onClick={() => setCurrentIndex(0)} className="group">
              <RotateCcw className="group-hover:rotate-180 duration-300 ease-in-out" />
              Refresh
            </Button>
          </div>
        ) : (
          <div className="mx-auto max-w-md">
            <MatchCard user={currentPotentialMatch} />
            <div className="mt-8">
              <MatchButtons onLike={handleLike} onPass={handlePass} disabled={isLiking} />
            </div>
          </div>
        )}
      </div>

      {matchedUser && (
        <MatchNotification
          match={matchedUser}
          open={!!matchedUser}
          onClose={() => setMatchedUser(null)}
          onStartChat={() => {
            const id = matchedUser.id;
            setMatchedUser(null);
            router.push(`/chat/${id}`);
          }}
        />
      )}
    </div>
  );
}
