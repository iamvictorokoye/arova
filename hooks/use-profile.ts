"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getCurrentUserProfile,
  updateUserProfile,
  uploadProfilePhoto,
} from "@/lib/actions/profile";
import type { UserProfile } from "@/lib/types";

export const profileKeys = {
  me: ["profile", "me"] as const,
};

export function useCurrentProfile() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: getCurrentUserProfile,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<UserProfile>) => updateUserProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me });
    },
  });
}

export function useUploadPhoto() {
  return useMutation({
    mutationFn: (file: File) => uploadProfilePhoto(file),
  });
}
