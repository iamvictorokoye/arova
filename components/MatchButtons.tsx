import { Heart, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface MatchButtonsProps {
  onLike: () => void;
  onPass: () => void;
  disabled?: boolean;
}

export default function MatchButtons({ onLike, onPass, disabled }: MatchButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-8">
      <Button
        onClick={onPass}
        disabled={disabled}
        variant="outline"
        size="icon"
        className="size-16 border-2 hover:border-destructive hover:text-destructive cursor-pointer"
        aria-label="Pass"
      >
        <X className="size-7" />
      </Button>

      <Button
        onClick={onLike}
        disabled={disabled}
        variant="outline"
        size="icon"
        className="size-16 border-2 hover:border-success hover:text-success cursor-pointer"
        aria-label="Like"
      >
        <Heart className="size-7" />
      </Button>
    </div>
  );
}
