import "../index.css";
import { useAuthStore } from "@/stores/authStore";
import { Navbar } from "@/components";
export const LandingLayout = ({ children }: React.PropsWithChildren) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="min-h-screen flex flex-col w-full align-middle justify-start">
      <Navbar isAuth={isAuthenticated} />
      <main className="bg-background flex-1">{children}</main>
    </div>
  );
};

export default LandingLayout;
