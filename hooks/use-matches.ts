"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getPotentialMatches, getUserMatches, likeUser } from "@/lib/actions/matches";

export const matchKeys = {
  potential: ["matches", "potential"] as const,
  mine: ["matches", "mine"] as const,
};

export function usePotentialMatches() {
  return useQuery({
    queryKey: matchKeys.potential,
    queryFn: getPotentialMatches,
    staleTime: 30_000,
  });
}

export function useUserMatches() {
  return useQuery({
    queryKey: matchKeys.mine,
    queryFn: getUserMatches,
  });
}

export function useLikeUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (toUserId: string) => likeUser(toUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchKeys.mine });
    },
  });
}
