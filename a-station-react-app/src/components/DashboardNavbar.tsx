// @flow

export const DashboardNavbar = () => {
  return (
    <div className="flex items-center justify-between h-16 px-4 bg-card border-b border-border">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-foreground">A-Station</h1>
      </div>
      <div className="flex items-center gap-2">
        {/* User actions, settings, etc. can go here */}
      </div>
    </div>
  );
};
