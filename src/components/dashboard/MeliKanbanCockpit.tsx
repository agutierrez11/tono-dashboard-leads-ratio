import React, { useState, useMemo, useCallback } from "react";
import { useMeliCockpit } from "@/hooks/useMeliCockpit";
import { CrmLead, LeadStage, TouchType, TouchLog } from "@/types/crm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  MapPin,
  Phone,
  MessageSquare,
  Mail,
  Plus,
  Check,
  Lock,
  Unlock,
  AlertTriangle,
  Calendar,
  Sparkles,
  Trophy,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  Compass,
  FileSpreadsheet,
  CheckCircle2,
  CheckSquare,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

// Mercado Pago Brand Colors
// Primary MP Blue: #009ee3 | MELI Navy: #0b1b3d | MP Green: #00a650 | MELI Yellow: #ffe600
const MP_BLUE = "#009ee3";
const MP_NAVY = "#0b1b3d";
const MP_GREEN = "#00a650";
const MP_YELLOW = "#ffe600";

interface KanbanColumn {
  id: string;
  stageKey: "prospecto" | "lead" | "negociacion" | "ganado" | "perdido";
  name: string;
  color: string;
  badgeBg: string;
  crmStages: LeadStage[];
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: "col-prospecto",
    stageKey: "prospecto",
    name: "Prospecto",
    color: "#009ee3",
    badgeBg: "bg-[#009ee3]/10 text-[#009ee3] border-[#009ee3]/30",
    crmStages: ["new"],
  },
  {
    id: "col-lead",
    stageKey: "lead",
    name: "Lead Calificado",
    color: "#19a69b",
    badgeBg: "bg-[#19a69b]/10 text-[#19a69b] border-[#19a69b]/30",
    crmStages: ["contacted"],
  },
  {
    id: "col-negociacion",
    stageKey: "negociacion",
    name: "Negociación / Cita",
    color: "#795bd2",
    badgeBg: "bg-[#795bd2]/10 text-[#795bd2] border-[#795bd2]/30",
    crmStages: ["visit", "proposal", "negotiation"],
  },
  {
    id: "col-ganado",
    stageKey: "ganado",
    name: "Ganado (Transacc.)",
    color: "#00a650",
    badgeBg: "bg-[#00a650]/10 text-[#00a650] border-[#00a650]/30",
    crmStages: ["won"],
  },
  {
    id: "col-perdido",
    stageKey: "perdido",
    name: "Perdido / Descarte",
    color: "#e95160",
    badgeBg: "bg-[#e95160]/10 text-[#e95160] border-[#e95160]/30",
    crmStages: ["lost"],
  },
];

export const MeliKanbanCockpit: React.FC = () => {
  const { activeLeads, stagingLeads, addTouch, updateStage, addLeadManual, activateNextBatch, metrics } = useMeliCockpit();

  const [activeTab, setActiveTab] = useState<"resumen" | "kanban">("resumen");
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  // Modals state
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    name: "",
    industry: "Restaurante & Bar",
    city: "Cancún",
    source: "Cambaceo en calle",
    contact_person: "",
    phone: "",
    notes: "",
  });

  // Candado Activity Modal state
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [targetLead, setTargetLead] = useState<CrmLead | null>(null);
  const [pendingTargetStage, setPendingTargetStage] = useState<LeadStage | null>(null);
  const [activityType, setActivityType] = useState<TouchType>("whatsapp");
  const [activityNote, setActivityNote] = useState("");
  const [activityError, setActivityError] = useState("");

  // Exception Modal
  const [isExceptionOpen, setIsExceptionOpen] = useState(false);
  const [exceptionLead, setExceptionLead] = useState<CrmLead | null>(null);
  const [exceptionReason, setExceptionReason] = useState("");
  const [exceptionReviewDate, setExceptionReviewDate] = useState("2026-11-04");

  // Filter state for quick search in Kanban
  const [kanbanSearch, setKanbanSearch] = useState("");

  // Helper: Get days in stage
  const getDaysInStage = (lead: CrmLead) => {
    const entered = lead.fecha_carga_mi_crm || lead.created_at;
    const diff = Date.now() - new Date(entered).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  // Helper: Check if lead has activity logged in current stage (The Candado)
  const hasActivityInCurrentStage = (lead: CrmLead) => {
    if (!lead.touches || lead.touches.length === 0) return false;
    // Check if there is at least one touch logged
    return lead.touches.length > 0;
  };

  // Handle Drag Start
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", leadId);
  };

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // Handle Drop with CANDADO check
  const handleDrop = (e: React.DragEvent, col: KanbanColumn) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("text/plain") || draggedLeadId;
    if (!leadId) return;

    const lead = activeLeads.find((l) => l.id === leadId);
    if (!lead) return;

    // Determine target CRM stage
    let targetStage: LeadStage = "contacted";
    if (col.stageKey === "prospecto") targetStage = "new";
    if (col.stageKey === "lead") targetStage = "contacted";
    if (col.stageKey === "negociacion") targetStage = "negotiation";
    if (col.stageKey === "ganado") targetStage = "won";
    if (col.stageKey === "perdido") targetStage = "lost";

    // If same stage, ignore
    if (col.crmStages.includes(lead.stage)) return;

    // CANDADO CHECK:
    // If attempting to advance and has no activity in current stage, lock and open modal!
    const hasLog = hasActivityInCurrentStage(lead);
    if (!hasLog && targetStage !== "lost") {
      setTargetLead(lead);
      setPendingTargetStage(targetStage);
      setActivityType("whatsapp");
      setActivityNote("");
      setActivityError("El candado está activo: registra primero una actividad concreta (mínimo 8 caracteres).");
      setIsActivityOpen(true);
      toast.warning(
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-xs">🔒 Candado Comercial Activo</span>
          <span className="text-[11px] text-muted-foreground">
            Para avanzar a {col.name}, registra antes un contacto o acuerdo real.
          </span>
        </div>
      );
      return;
    }

    // Has activity or is marking as lost: Proceed with stage transition!
    updateStage(lead.id, targetStage);
    toast.success(`✓ ${lead.company}: avanzada a ${col.name}`);
    setDraggedLeadId(null);
  };

  // Save Activity from Modal (Unlocks the Candado)
  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLead) return;

    const trimmed = activityNote.trim();
    if (trimmed.length < 8) {
      setActivityError("Describe el acuerdo o interacción con al menos 8 caracteres.");
      return;
    }

    // Add touch
    addTouch(targetLead.id, activityType, trimmed);

    // If there was a pending stage transition blocked by the candado, execute it now!
    if (pendingTargetStage) {
      updateStage(targetLead.id, pendingTargetStage);
      toast.success(`✓ Actividad guardada y comercio avanzado a ${pendingTargetStage.toUpperCase()}`);
    } else {
      toast.success(`✓ Actividad registrada para ${targetLead.company}`);
    }

    setIsActivityOpen(false);
    setTargetLead(null);
    setPendingTargetStage(null);
    setActivityNote("");
    setActivityError("");
  };

  // Open Activity Modal directly for a lead
  const openActivityModalForLead = (lead: CrmLead) => {
    setTargetLead(lead);
    setPendingTargetStage(null);
    setActivityType("whatsapp");
    setActivityNote("");
    setActivityError("");
    setIsActivityOpen(true);
  };

  // Handle Create New Lead
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newLeadForm.name.trim();
    if (!name) {
      toast.error("Ingresa el nombre del comercio");
      return;
    }

    const created = addLeadManual({
      name,
      company: name,
      industry: newLeadForm.industry,
      city: newLeadForm.city,
      phone: newLeadForm.phone,
      contact_person: newLeadForm.contact_person || "Encargado",
      operational_pain: newLeadForm.source,
      stage: "new",
    });

    if (created) {
      setIsNewLeadOpen(false);
      setNewLeadForm({
        name: "",
        industry: "Restaurante & Bar",
        city: "Cancún",
        source: "Cambaceo en calle",
        contact_person: "",
        phone: "",
        notes: "",
      });
      toast.success(`✓ ${name} guardado en Prospectos.`);
    }
  };

  // Group active leads by Kanban column
  const columnData = useMemo(() => {
    const q = kanbanSearch.toLowerCase().trim();
    const filtered = q
      ? activeLeads.filter(
          (l) =>
            l.company.toLowerCase().includes(q) ||
            l.name.toLowerCase().includes(q) ||
            (l.industry && l.industry.toLowerCase().includes(q)) ||
            (l.city && l.city.toLowerCase().includes(q))
        )
      : activeLeads;

    const map: Record<string, CrmLead[]> = {
      prospecto: [],
      lead: [],
      negociacion: [],
      ganado: [],
      perdido: [],
    };

    filtered.forEach((lead) => {
      if (lead.stage === "new") map.prospecto.push(lead);
      else if (lead.stage === "contacted") map.lead.push(lead);
      else if (lead.stage === "visit" || lead.stage === "proposal" || lead.stage === "negotiation")
        map.negociacion.push(lead);
      else if (lead.stage === "won") map.ganado.push(lead);
      else if (lead.stage === "lost") map.perdido.push(lead);
      else map.prospecto.push(lead);
    });

    return map;
  }, [activeLeads, kanbanSearch]);

  // Funnel conversion counts for Resumen
  const funnelCounts = useMemo(() => {
    const total = activeLeads.length;
    const leads = activeLeads.filter((l) => l.stage !== "new").length;
    const negoc = activeLeads.filter(
      (l) => l.stage === "visit" || l.stage === "proposal" || l.stage === "negotiation" || l.stage === "won"
    ).length;
    const won = activeLeads.filter((l) => l.stage === "won").length;

    return {
      total,
      leads,
      negoc,
      won,
      contactRate: total > 0 ? Math.round((leads / total) * 100) : 0,
      negocRate: leads > 0 ? Math.round((negoc / leads) * 100) : 0,
      wonRate: negoc > 0 ? Math.round((won / negoc) * 100) : 0,
    };
  }, [activeLeads]);

  return (
    <div className="space-y-5">
      {/* 1. Header con Identidad Mercado Pago / Mercado Libre */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#009ee3] flex items-center justify-center text-white font-extrabold shadow-sm">
            <span className="text-xl">🤝</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground tracking-tight">
                Panel Comercial • Mercado Pago
              </h1>
              <Badge className="bg-[#009ee3]/10 text-[#009ee3] border-[#009ee3]/30 text-[10px] font-semibold">
                Quintana Roo
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Control de prospección, candado de avance y velocidad de conversión hacia tu meta de 2 cierres.
            </p>
          </div>
        </div>

        {/* Acciones de Cabecera: Selector de Vistas + Botón Nuevo Comercio */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <div className="flex bg-muted/60 p-1 rounded-xl border border-border/60">
            <button
              onClick={() => setActiveTab("resumen")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "resumen"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>▦</span> Resumen
            </button>
            <button
              onClick={() => setActiveTab("kanban")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "kanban"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>▤</span> Tablero Kanban
            </button>
          </div>

          <Button
            onClick={() => setIsNewLeadOpen(true)}
            className="bg-[#009ee3] hover:bg-[#0087c2] text-white text-xs h-9 font-semibold shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            + Nuevo Comercio
          </Button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* VISTA 1: RESUMEN EJECUTIVO COMERCIAL                                  */}
      {/* ===================================================================== */}
      {activeTab === "resumen" && (
        <div className="space-y-5 animate-fade-in">
          {/* 4 KPIs Superiores */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-4 border shadow-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span>Prospectos Generados</span>
                <span className="w-7 h-7 rounded-lg bg-[#009ee3]/10 text-[#009ee3] flex items-center justify-center font-bold">
                  ◉
                </span>
              </div>
              <div className="text-2xl font-black text-foreground mt-2">
                {activeLeads.length}
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                <span className="text-[#00a650] font-semibold">En gestión activa</span>
                <span>• Quintana Roo</span>
              </div>
            </Card>

            <Card className="p-4 border shadow-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span>Leads Calificados</span>
                <span className="w-7 h-7 rounded-lg bg-[#19a69b]/10 text-[#19a69b] flex items-center justify-center font-bold">
                  ✓
                </span>
              </div>
              <div className="text-2xl font-black text-foreground mt-2">
                {funnelCounts.leads}
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                <span className="text-[#00a650] font-semibold">{funnelCounts.contactRate}%</span>
                <span>de contactabilidad</span>
              </div>
            </Card>

            <Card className="p-4 border shadow-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span>Negociaciones / Citas</span>
                <span className="w-7 h-7 rounded-lg bg-[#795bd2]/10 text-[#795bd2] flex items-center justify-center font-bold">
                  ↗
                </span>
              </div>
              <div className="text-2xl font-black text-foreground mt-2">
                {funnelCounts.negoc}
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                <span className="text-[#795bd2] font-semibold">{funnelCounts.negocRate}%</span>
                <span>tasa de calificación</span>
              </div>
            </Card>

            <Card className="p-4 border shadow-sm border-[#00a650]/30 bg-[#00a650]/5">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span className="font-semibold text-foreground">Cierres Ganados MP</span>
                <span className="w-7 h-7 rounded-lg bg-[#00a650] text-white flex items-center justify-center font-bold text-xs">
                  ★
                </span>
              </div>
              <div className="text-2xl font-black text-[#00a650] mt-2">
                {metrics.wonLeadsCount} <span className="text-xs text-muted-foreground font-normal">/ 2 Meta Nov</span>
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                <span className="font-semibold text-foreground">
                  ${(metrics.totalWonTpv / 1000).toLocaleString()}k MXN
                </span>
                <span>TPV Real</span>
              </div>
            </Card>
          </div>

          {/* Fila Media: Tacómetro de Actividad (67/75 o 15/día) + Desglose de Canales */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Tacómetro y Canales (7 columnas) */}
            <Card className="lg:col-span-7 border shadow-sm p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Meta de Actividad Diaria</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Acciones registradas hoy contra tu ritmo objetivo de 15 toques
                  </p>
                </div>
                <Badge className="bg-[#00a650]/10 text-[#00a650] border-[#00a650]/30 text-xs font-semibold">
                  {metrics.totalTouchesToday >= 8 ? "Ritmo Óptimo" : "En Progreso"}
                </Badge>
              </div>

              {/* Tacómetro Visual Semi-círculo */}
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative w-48 h-28 flex items-end justify-center">
                  <svg className="w-48 h-28 overflow-visible" viewBox="0 0 200 115">
                    {/* Background track */}
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="#eef1f6"
                      strokeWidth="16"
                      strokeLinecap="round"
                    />
                    {/* Red zone (0-7) */}
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="#ef5261"
                      strokeWidth="16"
                      strokeLinecap="round"
                      strokeDasharray="45 200"
                    />
                    {/* Amber zone (8-11) */}
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="#f2a51a"
                      strokeWidth="16"
                      strokeLinecap="round"
                      strokeDasharray="40 200"
                      strokeDashoffset="-45"
                    />
                    {/* Green zone (12-15) */}
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="#00a650"
                      strokeWidth="16"
                      strokeLinecap="round"
                      strokeDasharray="70 200"
                      strokeDashoffset="-85"
                    />
                    {/* Value in center */}
                    <text x="100" y="85" textAnchor="middle" className="text-3xl font-black fill-foreground">
                      {metrics.totalTouchesToday}
                    </text>
                    <text x="100" y="105" textAnchor="middle" className="text-[10px] font-bold fill-muted-foreground tracking-wider">
                      / 15 TOQUES HOY
                    </text>
                  </svg>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>{Math.min(100, Math.round((metrics.totalTouchesToday / 15) * 100))}% de tu meta</strong> • {Math.max(0, 15 - metrics.totalTouchesToday)} acciones para completarla
                </p>
              </div>

              {/* Desglose de los 4 Canales Operativos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t">
                <div className="p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/15 text-center">
                  <span className="text-[10px] text-muted-foreground block font-medium">Cambaceo</span>
                  <span className="text-lg font-black text-purple-600 block mt-0.5">
                    {metrics.cambaceoToday || metrics.visitsToday}
                  </span>
                  <div className="h-1 bg-purple-200 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-purple-600"
                      style={{ width: `${Math.min(100, ((metrics.cambaceoToday || metrics.visitsToday) / 5) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#00a650]/5 border border-[#00a650]/15 text-center">
                  <span className="text-[10px] text-muted-foreground block font-medium">WhatsApp</span>
                  <span className="text-lg font-black text-[#00a650] block mt-0.5">
                    {metrics.whatsappsToday}
                  </span>
                  <div className="h-1 bg-[#00a650]/20 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-[#00a650]"
                      style={{ width: `${Math.min(100, (metrics.whatsappsToday / 5) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#009ee3]/5 border border-[#009ee3]/15 text-center">
                  <span className="text-[10px] text-muted-foreground block font-medium">Llamadas</span>
                  <span className="text-lg font-black text-[#009ee3] block mt-0.5">
                    {metrics.callsToday}
                  </span>
                  <div className="h-1 bg-[#009ee3]/20 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-[#009ee3]"
                      style={{ width: `${Math.min(100, (metrics.callsToday / 5) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15 text-center">
                  <span className="text-[10px] text-muted-foreground block font-medium">Correos</span>
                  <span className="text-lg font-black text-amber-600 block mt-0.5">
                    {metrics.emailsToday}
                  </span>
                  <div className="h-1 bg-amber-200 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-amber-500"
                      style={{ width: `${Math.min(100, (metrics.emailsToday / 5) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Embudo Comercial Horizontal & Velocidad (5 columnas) */}
            <Card className="lg:col-span-5 border shadow-sm p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-foreground">Embudo de Conversión</h3>
                  <Badge variant="outline" className="text-[10px]">
                    4 Etapas
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-muted-foreground">1. Prospectos Activados</span>
                      <span className="font-bold text-foreground">{funnelCounts.total}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-[#009ee3]" style={{ width: "100%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-muted-foreground">2. De Prospecto a Lead</span>
                      <span className="font-bold text-foreground">{funnelCounts.leads} ({funnelCounts.contactRate}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-[#19a69b]" style={{ width: `${funnelCounts.contactRate}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-muted-foreground">3. Lead a Negociación</span>
                      <span className="font-bold text-foreground">{funnelCounts.negoc} ({funnelCounts.negocRate}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-[#795bd2]" style={{ width: `${funnelCounts.negocRate}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-muted-foreground">4. Negociación a Cierre</span>
                      <span className="font-bold text-[#00a650]">{funnelCounts.won} de 2</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-[#00a650]" style={{ width: `${(funnelCounts.won / 2) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Acceso Rápido a Kanban */}
              <div className="pt-4 border-t mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Gestiona el flujo visual de tus fichas con el candado comercial.
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab("kanban")}
                  className="text-xs h-8 border-[#009ee3]/30 text-[#009ee3] hover:bg-[#009ee3]/10"
                >
                  Abrir Kanban ➔
                </Button>
              </div>
            </Card>
          </div>

          {/* Fila Inferior: Mesa de Acción Inmediata (Tus 10 Comercios de Hoy con 1-clic) */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#009ee3]" />
                    <CardTitle className="text-sm font-bold text-foreground">
                      Tus Comercios en Curso • Quintana Roo
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] bg-[#009ee3]/5 text-[#009ee3] border-[#009ee3]/30">
                      {activeLeads.length} cuentas
                    </Badge>
                  </div>
                  <CardDescription className="text-xs mt-0.5">
                    Registra acciones en 1 clic para mover el tacómetro o cambia la etapa para alimentar el embudo.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => activateNextBatch(10)}
                    className="text-xs h-8"
                  >
                    <Layers className="h-3.5 w-3.5 mr-1" />
                    +10 del Banco Maestro
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {activeLeads.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <p className="text-xs text-muted-foreground">
                    No tienes prospectos activos en tu mesa de trabajo hoy.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => activateNextBatch(10)}
                    className="bg-[#009ee3] text-white text-xs"
                  >
                    Activar Primer Lote de 10
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-muted-foreground border-b font-medium">
                      <tr>
                        <th className="py-2.5 px-3">Comercio / Contacto</th>
                        <th className="py-2.5 px-3">Giro & Zona</th>
                        <th className="py-2.5 px-3 text-center">Registrar Acción (Mueve Tacómetro)</th>
                        <th className="py-2.5 px-3">Etapa Comercial</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {activeLeads.slice(0, 10).map((lead) => {
                        return (
                          <tr key={lead.id} className="hover:bg-muted/20 transition-colors">
                            {/* Comercio */}
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-foreground text-xs">
                                {lead.company || lead.name}
                              </div>
                              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                <span>{lead.contact_person || "Encargado"}</span>
                                {lead.phone && (
                                  <span className="font-mono text-[10px] text-slate-500">
                                    • {lead.phone}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Giro y Zona */}
                            <td className="py-2.5 px-3">
                              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                                {lead.industry || "General"}
                              </Badge>
                              <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                                <span>{lead.city || "Quintana Roo"}</span>
                              </div>
                            </td>

                            {/* Botones de Acción de 1 Clic */}
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    addTouch(lead.id, "cambaceo", "Visita presencial en calle");
                                  }}
                                  className="h-7 px-2 text-[11px] border-purple-500/30 hover:bg-purple-500/10 text-purple-600"
                                  title="Registrar visita de cambaceo"
                                >
                                  Visita
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    addTouch(lead.id, "whatsapp", "WhatsApp enviado");
                                    if (lead.phone) {
                                      const clean = lead.phone.replace(/\D/g, "");
                                      const wa = clean.startsWith("52") ? clean : `52${clean}`;
                                      window.open(`https://wa.me/${wa}`, "_blank");
                                    }
                                  }}
                                  className="h-7 px-2 text-[11px] border-[#00a650]/30 hover:bg-[#00a650]/10 text-[#00a650]"
                                  title="Abrir WhatsApp y registrar toque"
                                >
                                  WhatsApp
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    addTouch(lead.id, "call", "Llamada telefónica realizada");
                                    if (lead.phone) window.location.href = `tel:${lead.phone}`;
                                  }}
                                  className="h-7 px-2 text-[11px] border-[#009ee3]/30 hover:bg-[#009ee3]/10 text-[#009ee3]"
                                  title="Llamar y registrar toque"
                                >
                                  Llamar
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openActivityModalForLead(lead)}
                                  className="h-7 px-1.5 text-[11px] text-muted-foreground"
                                  title="Registrar nota detallada con candado"
                                >
                                  + Nota
                                </Button>
                              </div>
                            </td>

                            {/* Selector de Etapa Comercial */}
                            <td className="py-2.5 px-3">
                              <div className="w-[180px]">
                                <Select
                                  value={lead.stage}
                                  onValueChange={(val) => updateStage(lead.id, val as LeadStage)}
                                >
                                  <SelectTrigger className="h-7 text-[11px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="new">1. Prospecto (Inicial)</SelectItem>
                                    <SelectItem value="contacted" className="text-amber-600">
                                      2. Lead Calificado
                                    </SelectItem>
                                    <SelectItem value="proposal" className="text-purple-600">
                                      3. Negociación / Cita
                                    </SelectItem>
                                    <SelectItem value="won" className="text-[#00a650] font-bold">
                                      4. Ganado / Terminal Cerrada
                                    </SelectItem>
                                    <SelectItem value="lost" className="text-rose-600">
                                      Perdido / Descarte
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VISTA 2: TABLERO KANBAN CON CANDADO DE ACTIVIDAD                      */}
      {/* ===================================================================== */}
      {activeTab === "kanban" && (
        <div className="space-y-4 animate-fade-in">
          {/* Barra superior de herramientas Kanban */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card p-3 rounded-xl border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 text-[#009ee3]" />
              <span>
                <strong>Candado de Etapa activo:</strong> Para arrastrar una ficha a la siguiente etapa, debes registrar primero un contacto o nota en su etapa actual.
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Input
                placeholder="Buscar por comercio o giro..."
                value={kanbanSearch}
                onChange={(e) => setKanbanSearch(e.target.value)}
                className="h-8 text-xs w-full sm:w-56"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => activateNextBatch(10)}
                className="text-xs h-8 shrink-0"
              >
                +10 Leads
              </Button>
            </div>
          </div>

          {/* Columnas Kanban (5 columnas con Drag & Drop) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-start overflow-x-auto pb-4">
            {KANBAN_COLUMNS.map((col) => {
              const columnLeads = columnData[col.stageKey] || [];

              return (
                <div
                  key={col.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col)}
                  className="bg-muted/30 border rounded-xl p-2.5 min-h-[550px] flex flex-col justify-between transition-colors hover:bg-muted/40"
                >
                  {/* Encabezado de Columna */}
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: col.color }}
                        />
                        <span className="font-bold text-xs text-foreground">
                          {col.name}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-bold">
                        {columnLeads.length}
                      </Badge>
                    </div>

                    {/* Lista de Fichas / Tarjetas de Comercio */}
                    <div className="space-y-2">
                      {columnLeads.map((lead) => {
                        const days = getDaysInStage(lead);
                        const hasActivity = hasActivityInCurrentStage(lead);
                        const isOverdue = col.stageKey !== "ganado" && col.stageKey !== "perdido" && days > 7;
                        const isWarning = col.stageKey !== "ganado" && col.stageKey !== "perdido" && days >= 5 && days <= 7;

                        return (
                          <div
                            key={lead.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, lead.id)}
                            className={`p-3 rounded-lg border bg-card shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all text-xs space-y-2 ${
                              isOverdue
                                ? "border-l-4 border-l-rose-500"
                                : isWarning
                                ? "border-l-4 border-l-amber-500"
                                : "hover:border-primary/40"
                            }`}
                          >
                            {/* Nombre del Comercio & Teléfono */}
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <h4 className="font-bold text-foreground text-xs leading-tight">
                                  {lead.company || lead.name}
                                </h4>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {lead.industry} • {lead.city || "Quintana Roo"}
                                </p>
                              </div>
                              {lead.phone && (
                                <a
                                  href={`https://wa.me/52${lead.phone.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#00a650] hover:opacity-80 p-1 shrink-0"
                                  title="WhatsApp directo"
                                >
                                  <MessageSquare className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>

                            {/* Días en etapa & Candado status */}
                            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-border/50">
                              <span
                                className={`font-semibold px-1.5 py-0.5 rounded ${
                                  isOverdue
                                    ? "bg-rose-500/10 text-rose-600"
                                    : isWarning
                                    ? "bg-amber-500/10 text-amber-600"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {isOverdue && "⚠ "}
                                {days === 0 ? "Hoy" : `${days} d en etapa`}
                              </span>

                              {col.stageKey !== "ganado" && col.stageKey !== "perdido" && (
                                <span
                                  className={`flex items-center gap-1 font-medium ${
                                    hasActivity ? "text-[#00a650]" : "text-amber-600"
                                  }`}
                                >
                                  {hasActivity ? (
                                    <>
                                      <Check className="h-3 w-3" />
                                      {lead.touches.length} reg.
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="h-3 w-3" />
                                      Sin reg.
                                    </>
                                  )}
                                </span>
                              )}
                            </div>

                            {/* Botón de acción rápida para registrar actividad */}
                            {col.stageKey !== "ganado" && col.stageKey !== "perdido" && (
                              <div className="pt-1 flex items-center justify-between">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openActivityModalForLead(lead)}
                                  className="h-6 px-1.5 text-[10px] text-[#009ee3] hover:bg-[#009ee3]/10 font-medium w-full justify-center"
                                >
                                  + Registrar Actividad
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {columnLeads.length === 0 && (
                        <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground text-[11px]">
                          Arrastra aquí para mover a {col.name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 text-center text-[10px] text-muted-foreground/60">
                    {columnLeads.length} comercio(s)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: REGISTRAR ACTIVIDAD (CANDADO DE ETAPA)                          */}
      {/* ===================================================================== */}
      <Dialog open={isActivityOpen} onOpenChange={setIsActivityOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-[#009ee3]">
              <Lock className="h-5 w-5" />
              <DialogTitle className="text-base font-bold">
                Candado: Registrar Actividad Comercial
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              {targetLead?.company} está en etapa <strong>{targetLead?.stage}</strong>. Registra un contacto o acuerdo real para desbloquear el avance.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveActivity} className="space-y-3.5 pt-2">
            <div>
              <label className="text-xs font-semibold block mb-1">
                Tipo de Interacción <span className="text-rose-500">*</span>
              </label>
              <Select value={activityType} onValueChange={(val) => setActivityType(val as TouchType)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">💬 WhatsApp con el dueño / encargado</SelectItem>
                  <SelectItem value="call">📞 Llamada telefónica directa</SelectItem>
                  <SelectItem value="cambaceo">🚶‍♂️ Visita presencial en calle (Cambaceo)</SelectItem>
                  <SelectItem value="email">✉️ Correo electrónico formal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">
                ¿Qué ocurrió o qué acordaron? <span className="text-rose-500">*</span>
              </label>
              <Textarea
                value={activityNote}
                onChange={(e) => {
                  setActivityNote(e.target.value);
                  if (activityError) setActivityError("");
                }}
                placeholder="Ej. Hablé con Don Roberto; le presenté la tasa de Mercado Pago y acordamos cita el jueves..."
                className="text-xs min-h-[85px]"
              />
              {activityError ? (
                <p className="text-[10px] text-rose-500 font-medium mt-1">{activityError}</p>
              ) : (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Mínimo 8 caracteres para asegurar la veracidad de la gestión.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsActivityOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#009ee3] hover:bg-[#0087c2] text-white text-xs font-semibold"
              >
                Guardar y Desbloquear
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* MODAL: AGREGAR NUEVO COMERCIO                                         */}
      {/* ===================================================================== */}
      <Dialog open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-[#009ee3]">
              <Building2 className="h-5 w-5" />
              <DialogTitle className="text-base font-bold">
                Agregar Nuevo Comercio • Mercado Pago
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Regístralo una sola vez. Aparecerá en tu columna de Prospectos listo para registrar su primer contacto.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateLead} className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-semibold block mb-1">
                Nombre del Comercio <span className="text-rose-500">*</span>
              </label>
              <Input
                value={newLeadForm.name}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                placeholder="Ej. Restaurante Mariscos El Muelle"
                className="h-8 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold block mb-1">Giro / Industria</label>
                <Input
                  value={newLeadForm.industry}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, industry: e.target.value })}
                  placeholder="Ej. Restaurante"
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Ciudad / Municipio</label>
                <Input
                  value={newLeadForm.city}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, city: e.target.value })}
                  placeholder="Cancún, Playa, Tulum..."
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold block mb-1">Encargado / Dueño</label>
                <Input
                  value={newLeadForm.contact_person}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, contact_person: e.target.value })}
                  placeholder="Nombre de contacto"
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Teléfono / WhatsApp</label>
                <Input
                  value={newLeadForm.phone}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                  placeholder="998 123 4567"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Fuente de Origen</label>
              <Select
                value={newLeadForm.source}
                onValueChange={(val) => setNewLeadForm({ ...newLeadForm, source: val })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cambaceo en calle">🚶‍♂️ Cambaceo en calle</SelectItem>
                  <SelectItem value="Recomendación / referido">🤝 Recomendación / Referido</SelectItem>
                  <SelectItem value="Cartera propia">💼 Cartera propia</SelectItem>
                  <SelectItem value="Búsqueda en mapa o directorio">🗺️ Búsqueda en mapa o directorio</SelectItem>
                  <SelectItem value="Inbound / formulario">🌐 Inbound / Formulario</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNewLeadOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#009ee3] hover:bg-[#0087c2] text-white text-xs font-semibold"
              >
                Guardar en Prospectos
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
