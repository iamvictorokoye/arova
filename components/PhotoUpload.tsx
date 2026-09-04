"use client";

import { useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useUploadPhoto } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";

export default function PhotoUpload({
  onPhotoUploaded,
}: {
  onPhotoUploaded: (url: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate, isPending } = useUploadPhoto();

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB.");
      return;
    }

    mutate(file, {
      onSuccess: (result) => {
        if (result.success && result.url) {
          onPhotoUploaded(result.url);
        } else {
          toast.error(result.error ?? "Failed to upload photo.");
        }
      },
      onError: () => toast.error("Failed to upload photo."),
    });
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      <Button
        type="button"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={isPending}
        className="absolute right-0 bottom-0 size-9 shadow-md"
        title="Change photo"
      >
        {isPending ? <Loader2 className="animate-spin" /> : <Camera />}
      </Button>
    </>
  );
}
