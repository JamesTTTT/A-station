import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface ComingSoonDialogProps {
  feature: string;
  description?: string;
  trigger: ReactNode;
}

// Lightweight placeholder modal for features that aren't wired up yet.
// Replaces dead affordances (buttons that used to do nothing) with a
// clear signal: "this is planned, not broken."
export const ComingSoonDialog = ({
  feature,
  description,
  trigger,
}: ComingSoonDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <DialogTitle>{feature}</DialogTitle>
          </div>
          <DialogDescription className="pt-1">
            {description ??
              `${feature} is on the roadmap but not available in this build yet. Stay tuned — it's coming soon.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Got it
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
