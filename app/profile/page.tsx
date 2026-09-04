"use client";

import Link from "next/link";
import { BadgeCheck, CalendarDays, MapPin, Pencil, Ruler } from "lucide-react";

import { useCurrentProfile } from "@/hooks/use-profile";
import { calculateAge } from "@/lib/helpers/calculate-age";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import NotificationSoundSettings from "@/components/NotificationSoundSettings";

export default function ProfilePage() {
  const { data: profile, isLoading, isError, refetch } = useCurrentProfile();

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl flex-1 px-4 py-10">
        <Skeleton className="mb-8 h-10 w-48" />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-64 w-full rounded-3xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <h2 className="mb-2 text-xl font-semibold">
              We couldn&rsquo;t load your profile
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Something went wrong while fetching your details.
            </p>
            <Button onClick={() => refetch()}>Try again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl flex-1 px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My profile</h1>
        <p className="text-muted-foreground">
          Manage your profile and dating preferences
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-8">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <Avatar className="size-24 border-4 border-background shadow-md">
                <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                <AvatarFallback className="text-2xl">
                  {profile.full_name?.[0]?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  <h2 className="text-2xl font-bold">
                    {profile.full_name}, {calculateAge(profile.birthdate)}
                  </h2>
                  {profile.is_verified && (
                    <Badge variant="success" className="gap-1">
                      <BadgeCheck className="size-3.5" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">@{profile.username}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Member since {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="mb-2 font-semibold">About me</h3>
              <p className="leading-relaxed text-muted-foreground">
                {profile.bio || "No bio added yet."}
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">
                  Gender
                </p>
                <p className="capitalize">{profile.gender}</p>
              </div>
              <div>
                <p className="mb-1 flex items-center gap-1 text-sm font-medium text-muted-foreground">
                  <CalendarDays className="size-3.5" /> Birthday
                </p>
                <p>{new Date(profile.birthdate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">
                  Age range preference
                </p>
                <p>
                  {profile.preferences.age_range.min} –{" "}
                  {profile.preferences.age_range.max} years
                </p>
              </div>
              <div>
                <p className="mb-1 flex items-center gap-1 text-sm font-medium text-muted-foreground">
                  <MapPin className="size-3.5" /> Max distance
                </p>
                <p>Up to {profile.preferences.distance} km</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent>
              <h3 className="mb-4 font-semibold">Quick actions</h3>
              <Button asChild variant="secondary" className="w-full justify-start">
                <Link href="/profile/edit">
                  <Pencil />
                  Edit profile
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="mb-4 font-semibold">Account</h3>
              <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2.5 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Ruler className="size-3.5" /> Username
                </span>
                <span>@{profile.username}</span>
              </div>
            </CardContent>
          </Card>

          <NotificationSoundSettings />
        </div>
      </div>
    </div>
  );
}