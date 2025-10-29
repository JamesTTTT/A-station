import "../index.css";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { Navbar } from "@/components";
export const LandingLayout = ({ children }: React.PropsWithChildren) => {
  const { authState } = useAuth();

  return (
    <div className="min-h-screen flex flex-col w-full align-middle justify-start">
      <Navbar isAuth={authState.isAuthenticated} />
      <main className="bg-background flex-1">{children}</main>
    </div>
  );
};

export default LandingLayout;
