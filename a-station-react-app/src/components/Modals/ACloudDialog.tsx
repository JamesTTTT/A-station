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
import { Cloud, Check } from "lucide-react";

interface ACloudDialogProps {
  trigger: ReactNode;
}

const BULLETS = [
  "Zero-setup hosted control plane — no self-hosting, no upgrades",
  "Team workspaces with SSO and fine-grained access control",
  "Scheduled runs, approvals, and audit logs out of the box",
  "Priority support from the A-Station team",
];

// Upsell modal for the hosted offering. Replaces the old dead "Upgrade"
// button with a concrete pitch instead of a no-op.
export const ACloudDialog = ({ trigger }: ACloudDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary">
              <Cloud className="w-4 h-4" />
            </div>
            <DialogTitle>A-Station Cloud</DialogTitle>
          </div>
          <DialogDescription className="pt-1">
            Get everything you love about A-Station without running the
            infrastructure yourself. Cloud is in private beta — join the
            waitlist to get early access.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2.5 py-2">
          {BULLETS.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm">
              <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span className="text-foreground">{b}</span>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Maybe later
            </Button>
          </DialogClose>
          <Button type="button" disabled title="Waitlist coming soon">
            Join waitlist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
