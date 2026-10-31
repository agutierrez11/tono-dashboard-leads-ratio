import { BarChart3, Plus, Menu, LogOut, Table2, Layers, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface NavLinkProps {
  to: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

const NavLink = ({ to, label, icon, active, onClick }: NavLinkProps) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
      active
        ? "bg-[#009ee3]/10 text-[#009ee3]"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
    )}
    onClick={onClick}
  >
    {icon}
    <span>{label}</span>
  </Link>
);

export const Navbar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sesión cerrada correctamente");
  };

  const navLinks = [
    { to: "/", label: "Panel Comercial", icon: <BarChart3 className="h-4 w-4" /> },
    { to: "/leads-list", label: "Pipeline Activo", icon: <Table2 className="h-4 w-4" /> },
    { to: "/reports", label: "Reportes & Pacing", icon: <Layers className="h-4 w-4" /> },
  ];

  const handleLinkClick = () => {
    if (isMobile) {
      setOpen(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-card/95 backdrop-blur-md shadow-xs">
      <div className="container flex items-center justify-between h-14 px-4 mx-auto">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#009ee3] flex items-center justify-center text-white font-black text-sm shadow-sm">
              MP
            </div>
            <div className="flex flex-col">
              <span className="text-foreground font-black text-sm tracking-tight leading-none">
                Mercado Pago
              </span>
              <span className="text-[10px] text-[#009ee3] font-bold tracking-wider uppercase mt-0.5">
                Ventas QRoo
              </span>
            </div>
          </Link>

          {!isMobile && (
            <nav className="hidden md:flex items-center gap-1 ml-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  label={link.label}
                  icon={link.icon}
                  active={location.pathname === link.to}
                />
              ))}
            </nav>
          )}
        </div>

        {isMobile ? (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 pt-12">
              <nav className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    label={link.label}
                    icon={link.icon}
                    active={location.pathname === link.to}
                    onClick={handleLinkClick}
                  />
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00a650]/10 text-[#00a650] border border-[#00a650]/20">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00a650] animate-pulse" />
              Antonio Gutiérrez • Quintana Roo
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
