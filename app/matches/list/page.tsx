"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

import { useUserMatches } from "@/hooks/use-matches";
import { calculateAge } from "@/lib/helpers/calculate-age";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MatchesListPage() {
  const { data: matches = [], isLoading, isError, refetch } = useUserMatches();

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl flex-1 px-4 py-10">
        <Skeleton className="mx-auto mb-8 h-8 w-56" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <h2 className="mb-2 text-xl font-semibold">Failed to load matches</h2>
            <Button onClick={() => refetch()}>Try again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl flex-1 px-4 py-10">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Your matches</h1>
        <p className="text-muted-foreground">
          {matches.length} match{matches.length !== 1 ? "es" : ""}
        </p>
      </header>

      {matches.length === 0 ? (
        <div className="mx-auto max-w-md p-8 text-center">
          <span className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full brand-gradient text-primary-foreground">
            <Heart className="size-10" />
          </span>
          <h2 className="mb-4 text-2xl font-bold">No matches yet</h2>
          <p className="mb-6 text-muted-foreground">
            Start swiping to find your perfect match!
          </p>
          <Button asChild>
            <Link href="/matches">Start swiping</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {matches.map((match) => (
            <Link key={match.id} href={`/chat/${match.id}`}>
              <Card className="py-4 transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4">
                  <Avatar className="size-16">
                    <AvatarImage src={match.avatar_url} alt={match.full_name} />
                    <AvatarFallback>
                      {match.full_name?.[0]?.toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">
                      {match.full_name}, {calculateAge(match.birthdate)}
                    </h3>
                    <p className="mb-1 text-sm text-muted-foreground">
                      @{match.username}
                    </p>
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      {match.bio}
                    </p>
                  </div>

                  <Badge variant="success" className="shrink-0">
                    Online
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
