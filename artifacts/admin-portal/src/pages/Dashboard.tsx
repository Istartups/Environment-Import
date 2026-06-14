import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  CreditCard,
  KeyRound,
  LogOut,
  Menu,
  X,
  Crown,
  Settings,
  Sun,
  Moon,
  BookOpen,
  Bell,
  Users,
  MessageSquare,
  ScrollText,
  Share2,
  Smartphone,
  ChevronRight,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import SystemHealthBanner from "@/components/SystemHealthBanner";

function useHealthDot() {
  const [status, setStatus] = useState<"loading" | "healthy" | "warning" | "error">("loading");
  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch("/api/health");
        if (!r.ok) { setStatus("error"); return; }
        const d = await r.json();
        setStatus(d.status === "healthy" ? "healthy" : d.status === "degraded" ? "warning" : "error");
      } catch { setStatus("error"); }
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);
  return status;
}

const NAV_GROUPS = [
  {
    label: "Core",
    items: [
      { label: "Overview",  icon: LayoutDashboard, href: "/overview" },
      { label: "Accounts",  icon: Users,           href: "/accounts" },
      { label: "Lead CRM",  icon: MessageSquare,   href: "/crm" },
    ],
  },
  {
    label: "Revenue",
    items: [
      { label: "Payment",   icon: CreditCard, href: "/payment" },
      { label: "Licenses",  icon: KeyRound,   href: "/licenses" },
      { label: "Referrals", icon: Share2,     href: "/referrals" },
    ],
  },
  {
    label: "Engage",
    items: [
      { label: "Broadcast", icon: Bell, href: "/broadcast" },
    ],
  },
  {
    label: "Configure",
    items: [
      { label: "PWA Setup",    icon: Smartphone, href: "/pwa-settings" },
      { label: "Settings",     icon: Settings,   href: "/settings" },
      { label: "Deploy Guide", icon: BookOpen,   href: "/deploy-guide" },
      { label: "System Logs",  icon: ScrollText, href: "/logs" },
    ],
  },
];

function NavItem({ label, icon: Icon, href, isActive }: { label: string; icon: any; href: string; isActive: boolean }) {
  return (
    <Link href={href}>
      <div
        className={cn(
          "group flex items-center gap-3 mx-2 px-3 py-2 rounded-xl text-[13px] font-semibold cursor-pointer transition-all",
          isActive
            ? "text-amber-400"
            : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5"
        )}
        style={isActive ? { background: "rgba(212,160,32,0.10)" } : {}}
      >
        <div className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all",
          isActive ? "bg-amber-500/20" : "bg-transparent group-hover:bg-white/5"
        )}>
          <Icon size={14} className={isActive ? "text-amber-400" : ""} />
        </div>
        <span className="flex-1">{label}</span>
        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
      </div>
    </Link>
  );
}

function SidebarContent({ location, healthStatus, theme, toggleTheme, handleLogout, onClose }: {
  location: string;
  healthStatus: string;
  theme: string;
  toggleTheme: () => void;
  handleLogout: () => void;
  onClose?: () => void;
}) {
  return (
    <>
      {/* Brand */}
      <div className="px-4 pt-5 pb-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(212,160,32,0.15)" }}>
              <Crown size={16} style={{ color: "hsl(43,82%,55%)" }} />
            </div>
            <div>
              <p className="font-black text-sm leading-none" style={{ color: "hsl(43,82%,55%)" }}>OnePWA</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[10px] font-medium leading-none" style={{ color: "var(--sidebar-foreground)", opacity: 0.4 }}>Admin Portal</p>
                <span
                  title={
                    healthStatus === "healthy" ? "System healthy"
                    : healthStatus === "warning" ? "System degraded"
                    : healthStatus === "error" ? "System error"
                    : "Checking…"
                  }
                  className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    healthStatus === "healthy" ? "bg-emerald-500"
                    : healthStatus === "warning" ? "bg-amber-400"
                    : healthStatus === "error" ? "bg-red-500"
                    : "bg-slate-400 animate-pulse"
                  )}
                />
              </div>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">
              <X size={15} style={{ color: "var(--sidebar-foreground)", opacity: 0.5 }} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto space-y-0.5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-1">
            <p className="px-5 pt-3 pb-1 text-[9px] font-black uppercase tracking-[0.18em] opacity-30" style={{ color: "var(--sidebar-foreground)" }}>
              {group.label}
            </p>
            {group.items.map((item) => (
              <div key={item.href} onClick={onClose}>
                <NavItem
                  label={item.label}
                  icon={item.icon}
                  href={item.href}
                  isActive={location === item.href || location.startsWith(item.href + "/")}
                />
              </div>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-sidebar-border space-y-0.5">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-[13px] font-semibold transition-colors hover:bg-white/5"
          style={{ color: "var(--sidebar-foreground)", opacity: 0.6 }}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-white/5">
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </div>
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-[13px] font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-red-500/10">
            <LogOut size={14} className="text-red-400" />
          </div>
          Logout
        </button>
      </div>
    </>
  );
}

export default function Dashboard({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const healthStatus = useHealthDot();

  useEffect(() => { setMobileMenuOpen(false); }, [location]);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin_theme");
      if (saved === "dark" || saved === "light") return saved as "light" | "dark";
    }
    return "dark";
  });

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setLocation("/login");
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("admin_theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const sidebarStyle = {
    background: "var(--sidebar)",
    borderRight: "1px solid var(--sidebar-border)",
  };

  const currentPage = location.replace("/", "") || "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0" style={sidebarStyle}>
        <SidebarContent
          location={location}
          healthStatus={healthStatus}
          theme={theme}
          toggleTheme={toggleTheme}
          handleLogout={handleLogout}
        />
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 w-56 flex flex-col md:hidden" style={sidebarStyle}>
          <SidebarContent
            location={location}
            healthStatus={healthStatus}
            theme={theme}
            toggleTheme={toggleTheme}
            handleLogout={handleLogout}
            onClose={() => setMobileMenuOpen(false)}
          />
        </aside>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={18} />
            </button>
            <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-medium opacity-50">Admin</span>
              <ChevronRight size={12} className="opacity-30" />
              <span className="font-bold capitalize text-foreground">{currentPage}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <LogOut size={13} /> Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <SystemHealthBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
