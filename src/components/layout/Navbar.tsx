
import { Linkedin, Phone, Mail, BarChart3, Plus, Menu } from 'lucide-react';
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
      "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
      active
        ? "bg-primary/10 text-primary font-medium"
        : "text-foreground/70 hover:text-primary hover:bg-background"
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

  const navLinks = [
    { to: "/", label: "Dashboard", icon: <BarChart3 className="h-4 w-4" /> },
    { to: "/leads", label: "Leads", icon: <Plus className="h-4 w-4" /> },
    { to: "/linkedin", label: "LinkedIn", icon: <Linkedin className="h-4 w-4" /> },
    { to: "/phone", label: "Teléfono", icon: <Phone className="h-4 w-4" /> },
    { to: "/email", label: "Email", icon: <Mail className="h-4 w-4" /> },
  ];

  const handleLinkClick = () => {
    if (isMobile) {
      setOpen(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b">
      <div className="container flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-primary font-semibold text-base sm:text-lg animate-float">LeadTrack</span>
          </Link>

          {!isMobile && (
            <nav className="hidden md:flex items-center gap-1">
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
              <Button variant="ghost" size="icon" className="h-9 w-9">
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
                <div className="mt-4 pt-4 border-t">
                  <NavLink
                    to="/reports"
                    label="Reportes"
                    icon={<BarChart3 className="h-4 w-4" />}
                    active={location.pathname === "/reports"}
                    onClick={handleLinkClick}
                  />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        ) : (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" asChild>
              <Link to="/reports">Reportes</Link>
            </Button>
            <Button size="sm" className="animate-fade-in" asChild>
              <Link to="/leads">Agregar Lead</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
