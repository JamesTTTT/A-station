import {
  Canvas,
  DashboardNavbar,
  FileTree,
  SecondaryToolbar,
  Toolbar,
} from "@/components";

export const Dashboard = () => {
  return (
    <main className={"flex flex-col w-screen h-screen  -mx-auto"}>
      <DashboardNavbar />
      <div className={"flex flex-row justify-between h-full"}>
        <Toolbar />
        <FileTree />
        <Canvas />
        <SecondaryToolbar />
      </div>
    </main>
  );
};
