import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, Clock, Phone, MessageSquare, Mail, Copy, ExternalLink,
  Loader2, Calendar, RefreshCw, Filter, XCircle, ChevronRight, User,
  AlertCircle, CheckCheck, Send, Eye, EyeOff, Sparkles, Crown, Users
} from "lucide-react";
import { authFetch } from "@/lib/authFetch";
import { useToast } from "@/hooks/use-toast";
import { openWhatsApp, openSMS, openEmail } from "@/lib/utils";

interface Task {
  id: number;
  userId: number;
  taskType: string;
  status: "pending" | "completed" | "dismissed";
  triggerAt: string;
  completedAt: string | null;
  notes: string | null;
  user: {
    id: number;
    email: string | null;
    businessName: string | null;
    phone: string | null;
    whatsappNumber: string | null;
    profile: {
      name: string;
      city: string | null;
      state: string | null;
    } | null;
  };
}

interface Template {
  id: number;
  name: string;
  content: string;
}

const TASK_TYPE_LABELS: Record<string, string> = {
  "24h": "24-Hour Follow-Up",
  "48h": "48-Hour Follow-Up", 
  "72h": "72-Hour Follow-Up",
};

const TASK_TYPE_COLORS: Record<string, string> = {
  "24h": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "48h": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "72h": "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export default function AgentTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "completed" | "dismissed" | "all">("pending");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [composerMsg, setComposerMsg] = useState<Record<number, string>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<Record<number, number | "">>({});
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState<Task | null>(null);
  const { toast } = useToast();

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = filter === "all" ? "" : `?status=${filter}`;
      const res = await authFetch(`/api/crm/tasks${statusParam}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load tasks" });
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await authFetch("/api/crm/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.filter((t: Template) => !t.name.startsWith("📧 ") && !t.name.startsWith("📱 ")));
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchTemplates();
  }, [fetchTasks, fetchTemplates]);

  const updateTaskStatus = async (taskId: number, status: "completed" | "dismissed") => {
    setProcessingId(taskId);
    try {
      const res = await authFetch(`/api/crm/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast({ title: "Task Updated", description: `Task marked as ${status}` });
        fetchTasks();
        setExpandedTaskId(null);
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to update task" });
    } finally {
      setProcessingId(null);
    }
  };

  const buildMessage = (task: Task, templateContent: string) => {
    const name = task.user?.profile?.name || task.user?.businessName || task.user?.email?.split("@")[0] || "there";
    const business = task.user?.businessName || name;
    const phone = task.user?.phone || "";
    return templateContent
      .replace(/\{\{name\}\}/g, name)
      .replace(/\{\{business\}\}/g, business)
      .replace(/\{\{phone\}\}/g, phone);
  };

  const applyTemplate = (taskId: number, task: Task, templateId: number | "") => {
    setSelectedTemplate(prev => ({ ...prev, [taskId]: templateId }));
    if (templateId !== "") {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setComposerMsg(prev => ({ ...prev, [taskId]: buildMessage(task, template.content) }));
      }
    }
  };

  const copyMessage = (taskId: number) => {
    const msg = composerMsg[taskId];
    if (msg) {
      navigator.clipboard.writeText(msg);
      toast({ title: "Copied!", description: "Message copied to clipboard" });
    }
  };

  const getWhatsAppNumber = (task: Task): string | null => {
    return task.user?.whatsappNumber || task.user?.phone || null;
  };

  const stats = {
    pending: tasks.filter(t => t.status === "pending").length,
    completed: tasks.filter(t => t.status === "completed").length,
    dismissed: tasks.filter(t => t.status === "dismissed").length,
    overdue: tasks.filter(t => t.status === "pending" && new Date(t.triggerAt) < new Date()).length,
  };

  const isOverdue = (task: Task) => task.status === "pending" && new Date(task.triggerAt) < new Date();

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Follow-Up Tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Contact leads and convert them to premium customers</p>
        </div>
        <button onClick={fetchTasks} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Overdue", value: stats.overdue, icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Dismissed", value: stats.dismissed, icon: XCircle, color: "text-slate-400", bg: "bg-slate-500/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-2xl p-4 border border-border ${bg}`}>
            <div className="flex items-center gap-2">
              <Icon size={14} className={color} />
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
            </div>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 rounded-xl bg-muted/30 w-fit">
        {(["pending", "completed", "dismissed", "all"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
              filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f} {f !== "all" && `(${stats[f as keyof typeof stats]})`}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-3">
          <CheckCircle2 size={48} className="mx-auto opacity-30" />
          <p className="font-medium">No {filter !== "all" ? filter : ""} tasks</p>
          <p className="text-sm opacity-60">Complete tasks will appear here once leads need follow-up</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => {
            const overdue = isOverdue(task);
            const waNumber = getWhatsAppNumber(task);
            const name = task.user?.profile?.name || task.user?.businessName || task.user?.email?.split("@")[0] || "User";
            const isExpanded = expandedTaskId === task.id;
            const isProcessing = processingId === task.id;

            return (
              <div
                key={task.id}
                className={`rounded-2xl border transition-all ${
                  overdue ? "border-red-500/30 bg-red-500/5" : "border-border bg-card"
                } ${isExpanded ? "shadow-lg" : ""}`}
              >
                {/* Task Header */}
                <div className="p-4 cursor-pointer" onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}>
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <User size={16} className="text-primary" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${TASK_TYPE_COLORS[task.taskType] || "bg-slate-500/10 text-slate-400"}`}>
                          {TASK_TYPE_LABELS[task.taskType] || task.taskType}
                        </span>
                        {overdue && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                            OVERDUE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          Due: {new Date(task.triggerAt).toLocaleDateString()}
                        </span>
                        {task.user?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={10} />
                            {task.user.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      {waNumber && (
                        <a
                          href={`https://wa.me/${waNumber.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                          title="Open WhatsApp"
                        >
                          <MessageSquare size={14} />
                        </a>
                      )}
                      {task.user?.phone && (
                        <a
                          href={`tel:${task.user.phone.replace(/\D/g, "")}`}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                          title="Call"
                        >
                          <Phone size={14} />
                        </a>
                      )}
                      {task.status === "pending" && (
                        <>
                          <button
                            onClick={() => updateTaskStatus(task.id, "completed")}
                            disabled={isProcessing}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                            title="Mark Completed"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                          <button
                            onClick={() => updateTaskStatus(task.id, "dismissed")}
                            disabled={isProcessing}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Dismiss"
                          >
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                      <ChevronRight size={16} className={`text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </div>
                  </div>
                </div>

                {/* Expanded Composer */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-border space-y-3">
                    <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest pt-3 flex items-center gap-2">
                      <MessageSquare size={10} /> Compose Message
                    </p>

                    {/* Template Selector */}
                    {templates.length > 0 && (
                      <select
                        value={selectedTemplate[task.id] || ""}
                        onChange={(e) => applyTemplate(task.id, task, e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl text-sm bg-muted/20 border border-border outline-none focus:border-primary"
                      >
                        <option value="">— Pick a template —</option>
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    )}

                    {/* Message Textarea */}
                    <textarea
                      rows={4}
                      value={composerMsg[task.id] || ""}
                      onChange={(e) => setComposerMsg(prev => ({ ...prev, [task.id]: e.target.value }))}
                      placeholder="Type your message or select a template..."
                      className="w-full px-3 py-2 rounded-xl text-sm bg-muted/20 border border-border outline-none resize-none focus:border-primary"
                    />

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyMessage(task.id)}
                        disabled={!composerMsg[task.id]}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-muted/30 border border-border text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        <Copy size={12} /> Copy
                      </button>

                      {waNumber ? (
                        <a
                          href={`https://wa.me/${waNumber.replace(/\D/g, "")}${composerMsg[task.id] ? `?text=${encodeURIComponent(composerMsg[task.id])}` : ""}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors"
                        >
                          <ExternalLink size={12} /> Open in WhatsApp
                        </a>
                      ) : (
                        <span className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold opacity-40 bg-muted/30 border border-border text-muted-foreground">
                          No WhatsApp number available
                        </span>
                      )}
                    </div>

                    {/* Quick Note Field */}
                    <div className="pt-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Add Note (Optional)</label>
                      <textarea
                        rows={2}
                        placeholder="Log a note about this interaction..."
                        className="w-full px-3 py-2 mt-1 rounded-xl text-sm bg-muted/20 border border-border outline-none resize-none focus:border-primary"
                        onChange={async (e) => {
                          if (e.target.value.trim()) {
                            await authFetch(`/api/crm/tasks/${task.id}/note`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ notes: e.target.value }),
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}