import "./index.css";
import { Navbar } from "@/components";
export const Layout = ({ children }: React.PropsWithChildren) => (
  <div className="min-h-screen flex flex-col w-full align-middle justify-start">
    <Navbar />
    <main className="bg-background flex-1">{children}</main>
  </div>
);

export default Layout;
