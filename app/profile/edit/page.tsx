"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import PhotoUpload from "@/components/PhotoUpload";
import { useCurrentProfile, useUpdateProfile } from "@/hooks/use-profile";
import { profileEditSchema, type ProfileEditFormValues } from "@/lib/schemas";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

export default function EditProfilePage() {
  const router = useRouter();
  const { data: profile, isLoading } = useCurrentProfile();
  const { mutate: updateProfile, isPending: saving } = useUpdateProfile();

  const form = useForm<ProfileEditFormValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      full_name: "",
      username: "",
      bio: "",
      gender: "male",
      birthdate: "",
      avatar_url: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        gender: profile.gender || "male",
        birthdate: profile.birthdate || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile, form]);

  const bio = form.watch("bio") ?? "";
  const avatarUrl = form.watch("avatar_url");

  function onSubmit(values: ProfileEditFormValues) {
    updateProfile(values, {
      onSuccess: (result) => {
        if (result.success) {
          toast.success("Profile updated!");
          router.push("/profile");
        } else {
          toast.error(result.error ?? "Failed to update profile.");
        }
      },
      onError: () => toast.error("Failed to update profile."),
    });
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl flex-1 px-4 py-10">
        <Skeleton className="mb-8 h-10 w-56" />
        <Skeleton className="h-130 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl flex-1 px-4 py-10">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Edit profile</h1>
        <p className="text-muted-foreground">Update your profile information</p>
      </header>

      <Card>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="size-24 border-4 border-background shadow-md">
                    <AvatarImage src={avatarUrl} alt="Profile" />
                    <AvatarFallback className="text-2xl">?</AvatarFallback>
                  </Avatar>
                  <PhotoUpload
                    onPhotoUploaded={(url) =>
                      form.setValue("avatar_url", url, { shouldDirty: true })
                    }
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Upload a new profile picture
                  </p>
                  <p className="text-xs text-muted-foreground/80">
                    JPG, PNG or GIF. Max 5MB.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Choose a username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthdate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birthday</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About me</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        maxLength={500}
                        placeholder="Tell others about yourself..."
                        {...field}
                      />
                    </FormControl>
                    <div className="flex items-center justify-between">
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        {bio.length}/500 characters
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between border-t border-border pt-6">
                <Button type="button" variant="ghost" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="animate-spin" />}
                  Save changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
