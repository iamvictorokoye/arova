import Image from "next/image";
import { UserRound } from "lucide-react";

import { calculateAge } from "@/lib/helpers/calculate-age";
import type { UserProfile } from "@/lib/types";

export default function MatchCard({ user }: { user: UserProfile }) {
  const hasAvatar = Boolean(user.avatar_url);

  return (
    <div className="relative mx-auto w-full max-w-sm animate-swipe-in">
      <div className="card-swipe aspect-3/4">
        <div className="relative h-full w-full">
          {hasAvatar ? (
            <Image
              src={user.avatar_url}
              alt={user.full_name}
              fill
              sizes="(max-width: 640px) 100vw, 384px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <UserRound className="size-20 text-muted-foreground" />
            </div>
          )}

          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />

          <div className="absolute right-0 bottom-0 left-0 p-6 text-white">
            <h2 className="mb-1 text-2xl font-bold">
              {user.full_name}, {calculateAge(user.birthdate)}
            </h2>
            <p className="mb-2 text-sm opacity-90">@{user.username}</p>
            <p className="line-clamp-3 text-sm leading-relaxed opacity-95">
              {user.bio}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}