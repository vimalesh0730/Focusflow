import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, BookOpen, CalendarClock, CalendarDays, LayoutDashboard, ListChecks, LogOut, Menu, Settings, Timer } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const links = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/focus", label: "Focus Clock", icon: Timer },
  { to: "/app/calendar", label: "Smart Calendar", icon: CalendarDays },
  { to: "/app/subjects", label: "Subjects", icon: BookOpen },
  { to: "/app/tasks", label: "Tasks", icon: ListChecks },
  { to: "/app/schedule", label: "Smart Schedule", icon: CalendarClock },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const nav = useNavigate();
  return (
    <div className="flex h-full flex-col">
      <Link to="/" className="px-5 py-5"><Logo /></Link>
      <nav className="flex-1 space-y-1 px-3">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}>
            <Icon className="h-4 w-4" /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3">
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground"
          onClick={async () => { await supabase.auth.signOut(); nav("/"); }}>
          <LogOut className="h-4 w-4" /> Log out
        </Button>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r bg-card md:block"><Nav /></aside>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-card px-4 py-3 md:hidden">
        <Button variant="outline" size="icon" aria-label="Open menu" onClick={() => setOpen(true)}><Menu className="h-4 w-4" /></Button>
        <Logo />
      </header>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Nav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <main className="p-4 md:ml-60 md:p-8"><Outlet /></main>
    </div>
  );
}