import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  Button,
} from "@/components";
import { GalleryVerticalEnd } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export const Navbar = ({ isAuth }: { isAuth: boolean }) => {
  const navigate = useNavigate();
  return (
    <div className="w-full h-14 flex flex-row justify-between items-center px-6">
      <NavigationMenu>
        <NavigationMenuList className="gap-8">
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <div className="flex justify-center gap-2 md:justify-start">
                <a href="/" className="flex items-center gap-2 font-medium">
                  <div className="bg-primary  flex size-6 items-center justify-center rounded-md">
                    <GalleryVerticalEnd className="size-4 text-primary-foreground" />
                  </div>
                  A-Station
                </a>
              </div>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <a href="/docs">Docs</a>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <a href="/donate">Donate</a>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      {isAuth ? (
        <Button onClick={() => navigate({ to: "/workspaces/select" })}>
          Dashboard
        </Button>
      ) : (
        <Button onClick={() => navigate({ to: "/login" })}>Sign In</Button>
      )}
    </div>
  );
};
