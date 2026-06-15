import { Link, useLocation } from "wouter";
import { LogOut, MessageSquare, Crown, Sun, Moon, ClipboardList, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function AgentDashboard({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin_theme");
      if (saved === "dark" || saved === "light") return saved as "light" | "dark";
    }
    return "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const handleLogout = () => {
    localStorage.removeItem("agent_token");
    setLocation("/agent-login");
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("admin_theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const [taskCount, setTaskCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const fetchTaskCount = async () => {
      try {
        const res = await fetch("/api/crm/tasks?status=pending");
        if (res.ok) { const tasks = await res.json(); setTaskCount(tasks.length); }
      } catch {}
    };
    fetchTaskCount();
    const interval = setInterval(fetchTaskCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("agent_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setAgentName(payload.name || "Agent");
        setAgentPhone(payload.phone || "");
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (agentName) {
      const hasSeenWelcome = localStorage.getItem("agent_welcome_seen");
      if (!hasSeenWelcome) { setShowWelcome(true); localStorage.setItem("agent_welcome_seen", "true"); }
    }
  }, [agentName]);

  const menuItems = [
    { label: "Leads CRM",     icon: MessageSquare, href: "/crm" },
    { label: "Tasks",         icon: ClipboardList,  href: "/tasks" },
  ];

  const sidebarStyle = { background: "var(--sidebar)", borderRight: "1px solid var(--sidebar-border)", borderRadius: "0 24px 24px 0" };
  const activeItemStyle = { background: "rgba(212,160,32,0.12)", color: "hsl(43,82%,55%)", borderRight: "3px solid hsl(43,82%,55%)" };
  const itemStyle = { color: "var(--sidebar-foreground)" };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — Desktop */}
      <aside className={cn("hidden md:flex flex-col shrink-0 transition-all duration-300 relative", sidebarCollapsed ? "w-16" : "w-56")} style={sidebarStyle}>
        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-20 hidden md:flex w-6 h-6 rounded-full bg-sidebar border border-sidebar-border items-center justify-center cursor-pointer z-10">
          {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
        <div className="px-3 py-5 border-b border-sidebar-border">
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-2">
                <MessageSquare size={18} style={{ color: "hsl(43,82%,55%)" }} />
                <span className="font-black text-base" style={{ color: "hsl(43,82%,55%)" }}>OnePWA</span>
              </div>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--sidebar-foreground)", opacity: 0.4 }}>Agent Portal</p>
              <div className="mt-3 pt-2 border-t border-sidebar-border/50">
                <p className="text-[11px] font-semibold truncate">{agentName || "Agent"}</p>
                {agentPhone && <p className="text-[9px] text-muted-foreground truncate">{agentPhone}</p>}
              </div>
            </>
          ) : (
            <MessageSquare size={18} style={{ color: "hsl(43,82%,55%)", margin: "0 auto" }} />
          )}
        </div>
        <nav className="flex-1 py-4">
          {menuItems.map((item, i) => {
            const isActive = location === item.href;
            return (
              <Link key={i} href={item.href}>
                <div className={cn("flex items-center gap-3 px-3 py-2.5 text-sm font-semibold cursor-pointer transition-all hover:bg-white/5 relative", !sidebarCollapsed && "px-5")}
                  style={isActive ? activeItemStyle : itemStyle} title={sidebarCollapsed ? item.label : ""}>
                  <item.icon size={15} />
                  {!sidebarCollapsed && <span className="flex-1">{item.label}</span>}
                  {!sidebarCollapsed && item.label === "Tasks" && taskCount > 0 && (
                    <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{taskCount}</span>
                  )}
                  {sidebarCollapsed && item.label === "Tasks" && taskCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
        {!sidebarCollapsed && (
          <div className="px-4 py-4 border-t border-sidebar-border space-y-2">
            <button onClick={toggleTheme} className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-white/5" style={itemStyle}>
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors">
              <LogOut size={15} /> Logout
            </button>
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col md:hidden shadow-2xl animate-in slide-in-from-left duration-300" style={sidebarStyle}>
          <div className="px-5 py-5 border-b border-sidebar-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} style={{ color: "hsl(43,82%,55%)" }} />
              <span className="font-black text-base" style={{ color: "hsl(43,82%,55%)" }}>OnePWA</span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg hover:bg-white/10"><X size={18} /></button>
          </div>
          <nav className="flex-1 py-4">
            {menuItems.map((item, i) => {
              const isActive = location === item.href;
              return (
                <Link key={i} href={item.href}>
                  <div onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-5 py-2.5 text-sm font-semibold cursor-pointer transition-all hover:bg-white/5"
                    style={isActive ? activeItemStyle : itemStyle}>
                    <item.icon size={15} /> {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>
          <div className="px-4 py-4 border-t border-sidebar-border space-y-2">
            <button onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-white/5" style={itemStyle}>
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
            <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors">
              <LogOut size={15} /> Logout
            </button>
          </div>
        </aside>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-medium">Agent</span>
              <span className="opacity-30">/</span>
              <span className="font-bold capitalize text-foreground">
                {location === "/crm" ? "Lead CRM" : location === "/tasks" ? "Tasks" : "Dashboard"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors font-semibold">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          {showWelcome && (
            <div className="mx-4 mt-4 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">Welcome back, {agentName}! 👋</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">You have {taskCount} pending follow-up tasks.</p>
                </div>
                <button onClick={() => setShowWelcome(false)} className="text-xs text-muted-foreground hover:text-foreground">Dismiss</button>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
