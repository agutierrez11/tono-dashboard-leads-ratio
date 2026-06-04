
import { Navbar } from "./Navbar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardLayout = ({ children, className }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-slate-100/40 dark:to-zinc-950/40">
      <Navbar />

      <main className={cn("container px-4 pt-24 pb-12 mx-auto animate-fade-in", className)}>
        {children}
      </main>
    </div>
  );
};
