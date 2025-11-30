import { GalleryVerticalEnd, ListFilterPlus, Plus } from "lucide-react";
import { Button } from "@/components/ui";

export const DashboardNavigation = () => {
  return (
    <div className="flex flex-col items-center w-10 h-full bg-card border-r border-border">
      <div className="flex flex-col items-center">
        <Button className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted hover:bg-accent transition-colors">
          <span className="text-muted-foreground text-sm">
            <Plus />
          </span>
        </Button>
        <Button className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted hover:bg-accent transition-colors">
          <span className="text-muted-foreground text-sm">
            <GalleryVerticalEnd />
          </span>
        </Button>

        <Button className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted hover:bg-accent transition-colors">
          <span className="text-muted-foreground text-sm">
            <ListFilterPlus />
          </span>
        </Button>
      </div>
    </div>
  );
};
