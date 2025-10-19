import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components";

export const Navbar = () => {
  return (
    <div className="w-full h-14 flex flex-row justify-between items-center px-6">
      <NavigationMenu>
        <NavigationMenuList className="gap-8">
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <a href="/">Home</a>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <a href="/docs">Docs</a>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <a href="/get-started">Get Started</a>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <a
        href="/login"
        className="bg-foreground text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors font-medium"
      >
        Sign In
      </a>
    </div>
  );
};
