import { useState, useEffect, useMemo, useCallback } from "react";
import { CrmLead, TouchLog, TouchType, LeadStage } from "@/types/crm";
import { toast } from "sonner";

const ACTIVE_LEADS_KEY = "meli_cockpit_leads_nov2026";
const STAGING_LEADS_KEY = "meli_staging_leads_nov2026";

export const useMeliCockpit = () => {
  const [activeLeads, setActiveLeads] = useState<CrmLead[]>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_LEADS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [stagingLeads, setStagingLeads] = useState<CrmLead[]>(() => {
    try {
      const saved = localStorage.getItem(STAGING_LEADS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(ACTIVE_LEADS_KEY, JSON.stringify(activeLeads));
  }, [activeLeads]);

  useEffect(() => {
    localStorage.setItem(STAGING_LEADS_KEY, JSON.stringify(stagingLeads));
  }, [stagingLeads]);

  // Anti-duplicate check
  const isDuplicate = useCallback(
    (phone?: string, name?: string): boolean => {
      const cleanPhone = (phone || "").replace(/\D/g, "");
      const cleanName = (name || "").toLowerCase().trim();

      const existsInActive = activeLeads.some((l) => {
        const lp = (l.phone || "").replace(/\D/g, "");
        const ln = (l.name || l.company || "").toLowerCase().trim();
        return (cleanPhone && lp && (cleanPhone.endsWith(lp) || lp.endsWith(cleanPhone))) ||
               (cleanName && ln === cleanName);
      });

      return existsInActive;
    },
    [activeLeads]
  );

  // Add Single Lead Manually
  const addLeadManual = useCallback(
    (leadData: Partial<CrmLead>): boolean => {
      if (isDuplicate(leadData.phone, leadData.name || leadData.company)) {
        toast.warning("Este comercio o teléfono ya existe en tu CRM activo.");
        return false;
      }

      const now = new Date().toISOString();
      const newLead: CrmLead = {
        id: `MANUAL-${Date.now()}`,
        name: leadData.name || leadData.company || "Nuevo Comercio",
        company: leadData.company || leadData.name || "Sin Empresa",
        contact_person: leadData.contact_person || "Director / Dueño",
        phone: leadData.phone || "",
        phone_intl: leadData.phone_intl || (leadData.phone ? `+52 ${leadData.phone}` : ""),
        whatsapp_link: leadData.whatsapp_link || (leadData.phone ? `https://wa.me/52${leadData.phone.replace(/\D/g, "")}` : ""),
        email: leadData.email || "",
        website_or_ig: leadData.website_or_ig || "",
        address_full: leadData.address_full || "",
        street_and_number: leadData.street_and_number || "",
        neighborhood: leadData.neighborhood || "",
        postal_code: leadData.postal_code || "",
        city: leadData.city || "Quintana Roo",
        state: leadData.state || "Quintana Roo",
        industry: leadData.industry || "General",
        mcc: leadData.mcc || "",
        product_opportunity: leadData.product_opportunity || "Point Smart 4G",
        tpv_monthly: leadData.tpv_monthly || 450000,
        quality_points: leadData.quality_points || 2.5,
        operational_pain: leadData.operational_pain || "",
        opening_hook: leadData.opening_hook || "",
        stage: "new",
        status_mi_crm: "Activo en Mi CRM",
        status_meli_crm: "Pendiente",
        fecha_carga_mi_crm: now,
        touches: [],
        created_at: now,
        updated_at: now,
      };

      setActiveLeads((prev) => [newLead, ...prev]);
      toast.success(`Comercio ${newLead.company} agregado a tu CRM.`);
      return true;
    },
    [isDuplicate]
  );

  // Load Staging Master Base (from Google Sheets or CSV)
  const setStagingBase = useCallback((leads: CrmLead[]) => {
    setStagingLeads(leads);
    toast.success(`Banco maestro cargado con ${leads.length} prospectos.`);
  }, []);

  // Activate Next Batch of 10 Leads
  const activateNextBatch = useCallback((batchSize: number = 10) => {
    setStagingLeads((prevStaging) => {
      const available = prevStaging.filter((l) => l.status_mi_crm !== "Activo en Mi CRM");
      if (available.length === 0) {
        toast.info("No hay más leads pendientes en tu banco maestro.");
        return prevStaging;
      }

      const batchToActivate = available.slice(0, batchSize);
      const now = new Date().toISOString();

      const activatedWithTimestamps = batchToActivate.map((l) => ({
        ...l,
        status_mi_crm: "Activo en Mi CRM" as const,
        fecha_carga_mi_crm: now,
        updated_at: now,
      }));

      setActiveLeads((prevActive) => [...activatedWithTimestamps, ...prevActive]);

      // Update staging status
      const activatedIds = new Set(batchToActivate.map((l) => l.id));
      const updatedStaging = prevStaging.map((l) =>
        activatedIds.has(l.id)
          ? { ...l, status_mi_crm: "Activo en Mi CRM" as const, fecha_carga_mi_crm: now }
          : l
      );

      toast.success(`🚀 ¡Lote de ${batchToActivate.length} leads activado en tu CRM!`);
      return updatedStaging;
    });
  }, []);

  // Add Touch (WhatsApp, Call, Visit, Email)
  const addTouch = useCallback((leadId: string, type: TouchType, note?: string) => {
    const now = new Date().toISOString();
    const touchObj: TouchLog = {
      id: `touch-${Date.now()}`,
      type,
      date: now,
      note: note || "",
    };

    setActiveLeads((prev) =>
      prev.map((lead) => {
        if (lead.id !== leadId) return lead;

        const newTouches = [...lead.touches, touchObj];
        const newStage = lead.stage === "new" ? "contacted" : lead.stage;
        const contactedAt = lead.contacted_at || now;

        return {
          ...lead,
          touches: newTouches,
          stage: newStage,
          contacted_at: contactedAt,
          updated_at: now,
        };
      })
    );

    const labels: Record<TouchType, string> = {
      whatsapp: "WhatsApp enviado",
      call: "Llamada registrada",
      visit: "Visita presencial guardada",
      email: "Correo registrado",
    };
    toast.success(labels[type]);
  }, []);

  // Update Lead Stage
  const updateStage = useCallback((leadId: string, stage: LeadStage) => {
    const now = new Date().toISOString();

    setActiveLeads((prev) =>
      prev.map((lead) => {
        if (lead.id !== leadId) return lead;

        const isClosed = stage === "won" || stage === "lost";
        const closedAt = isClosed ? (lead.closed_at || now) : undefined;
        let daysInCycle = lead.days_in_cycle;

        if (isClosed && lead.created_at) {
          const diffMs = new Date(closedAt || now).getTime() - new Date(lead.created_at).getTime();
          daysInCycle = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
        }

        return {
          ...lead,
          stage,
          closed_at: closedAt,
          days_in_cycle: daysInCycle,
          updated_at: now,
        };
      })
    );

    toast.success(`Etapa actualizada a: ${stage}`);
  }, []);

  // Mark uploaded to MELI CRM
  const markUploadedToMeli = useCallback((leadId: string) => {
    const now = new Date().toISOString();
    setActiveLeads((prev) =>
      prev.map((lead) => {
        if (lead.id !== leadId) return lead;
        return {
          ...lead,
          status_meli_crm: "Cargado en MELI CRM",
          fecha_carga_meli: now,
          updated_at: now,
        };
      })
    );
    toast.success("✅ Marcado como cargado en CRM de Mercado Libre");
  }, []);

  // Clear all data (Clean Slate)
  const clearAllData = useCallback(() => {
    setActiveLeads([]);
    setStagingLeads([]);
    localStorage.removeItem(ACTIVE_LEADS_KEY);
    localStorage.removeItem(STAGING_LEADS_KEY);
    toast.info("Datos reiniciados en ceros para Noviembre 2026.");
  }, []);

  // Calculate Metrics & Analytics
  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    let callsToday = 0;
    let whatsappsToday = 0;
    let visitsToday = 0;
    let emailsToday = 0;

    let leadsToday = 0;
    let leadsThisWeek = 0;
    let leadsThisMonth = 0;

    const staleLeads: CrmLead[] = [];
    const wonLeads: CrmLead[] = [];

    // Industry and Product buckets
    const industryStats: Record<string, { count: number; won: number; totalDays: number; tpv: number }> = {};
    const productStats: Record<string, { count: number; won: number; totalDays: number; tpv: number }> = {};

    activeLeads.forEach((lead) => {
      const createdDate = new Date(lead.created_at);

      if (createdDate >= today) leadsToday++;
      if (createdDate >= startOfWeek) leadsThisWeek++;
      if (createdDate >= startOfMonth) leadsThisMonth++;

      // Touches
      lead.touches.forEach((t) => {
        const touchDate = new Date(t.date);
        if (touchDate >= today) {
          if (t.type === "call") callsToday++;
          if (t.type === "whatsapp") whatsappsToday++;
          if (t.type === "visit") visitsToday++;
          if (t.type === "email") emailsToday++;
        }
      });

      // Check Stale (+7 days without touch)
      if (lead.stage !== "won" && lead.stage !== "lost") {
        const lastTouch =
          lead.touches.length > 0
            ? new Date(lead.touches[lead.touches.length - 1].date)
            : createdDate;
        const daysDiff = Math.floor((today.getTime() - lastTouch.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 7) {
          staleLeads.push(lead);
        }
      }

      // Won deals
      if (lead.stage === "won") {
        wonLeads.push(lead);
      }

      // Industry aggregations
      const ind = lead.industry || "Otra";
      if (!industryStats[ind]) {
        industryStats[ind] = { count: 0, won: 0, totalDays: 0, tpv: 0 };
      }
      industryStats[ind].count++;
      industryStats[ind].tpv += lead.tpv_monthly || 0;
      if (lead.stage === "won" && lead.days_in_cycle) {
        industryStats[ind].won++;
        industryStats[ind].totalDays += lead.days_in_cycle;
      }

      // Product aggregations
      const prod = lead.product_opportunity || "Point Smart";
      if (!productStats[prod]) {
        productStats[prod] = { count: 0, won: 0, totalDays: 0, tpv: 0 };
      }
      productStats[prod].count++;
      productStats[prod].tpv += lead.tpv_monthly || 0;
      if (lead.stage === "won" && lead.days_in_cycle) {
        productStats[prod].won++;
        productStats[prod].totalDays += lead.days_in_cycle;
      }
    });

    const totalTouchesToday = callsToday + whatsappsToday + visitsToday + emailsToday;

    // Sales Velocity (Hero Metric)
    const totalWonWithDays = wonLeads.filter((l) => l.days_in_cycle && l.days_in_cycle > 0);
    const avgDaysToClose =
      totalWonWithDays.length > 0
        ? Number(
            (
              totalWonWithDays.reduce((acc, l) => acc + (l.days_in_cycle || 0), 0) /
              totalWonWithDays.length
            ).toFixed(1)
          )
        : 0;

    // Velocity Distribution Bins
    const velocityBins = [
      { range: "⚡ < 3 días", count: 0 },
      { range: "📅 4 - 7 días", count: 0 },
      { range: "⏳ 8 - 14 días", count: 0 },
      { range: "🐢 15 - 30 días", count: 0 },
      { range: "⚠️ > 30 días", count: 0 },
    ];

    totalWonWithDays.forEach((l) => {
      const d = l.days_in_cycle || 1;
      if (d < 3) velocityBins[0].count++;
      else if (d <= 7) velocityBins[1].count++;
      else if (d <= 14) velocityBins[2].count++;
      else if (d <= 30) velocityBins[3].count++;
      else velocityBins[4].count++;
    });

    // Pie chart industry data
    const pieIndustryData = Object.entries(industryStats).map(([name, data]) => ({
      name,
      value: data.count,
      tpv: data.tpv,
      won: data.won,
      avgDays: data.won > 0 ? Number((data.totalDays / data.won).toFixed(1)) : 0,
    }));

    // Product breakdown data
    const productBreakdown = Object.entries(productStats).map(([name, data]) => ({
      name,
      count: data.count,
      won: data.won,
      tpv: data.tpv,
      avgDays: data.won > 0 ? Number((data.totalDays / data.won).toFixed(1)) : 0,
    }));

    return {
      callsToday,
      whatsappsToday,
      visitsToday,
      emailsToday,
      totalTouchesToday,
      leadsToday,
      leadsThisWeek,
      leadsThisMonth,
      staleLeads,
      wonLeadsCount: wonLeads.length,
      totalWonTpv: wonLeads.reduce((acc, l) => acc + (l.tpv_monthly || 0), 0),
      avgDaysToClose,
      velocityBins,
      pieIndustryData,
      productBreakdown,
      stagingCount: stagingLeads.filter((l) => l.status_mi_crm !== "Activo en Mi CRM").length,
    };
  }, [activeLeads, stagingLeads]);

  return {
    activeLeads,
    stagingLeads,
    metrics,
    addLeadManual,
    activateNextBatch,
    setStagingBase,
    addTouch,
    updateStage,
    markUploadedToMeli,
    clearAllData,
  };
};
