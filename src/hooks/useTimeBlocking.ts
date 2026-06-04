import { useState, useMemo } from "react";
import { useFunnelMetrics } from "@/contexts/FunnelMetricsContext";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";

export interface TimeBlock {
  startTime: string;
  endTime: string;
  activity: string;
  category: "prospecting" | "calls" | "emails" | "meetings" | "admin" | "break";
  priority: "high" | "medium" | "low";
  iconKey: "users" | "phone" | "mail" | "target" | "coffee" | "calendar" | "clock";
  color: string;
  notes: string;
}

export const useTimeBlocking = () => {
  const { callMetrics, emailMetrics, prospectMetrics } = useFunnelMetrics();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0); // 0 = Lunes, etc.

  // Calculate conversion rates from context
  const conversionRates = useMemo(() => {
    return {
      callConnection: callMetrics.llamadasRealizadas > 0 ? (callMetrics.contestadas / callMetrics.llamadasRealizadas) * 100 : 50,
      callMeeting: callMetrics.conversaciones > 0 ? (callMetrics.reuniones / callMetrics.conversaciones) * 100 : 10,
      emailOpen: emailMetrics.emailsEnviados > 0 ? (emailMetrics.emailsAbiertos / emailMetrics.emailsEnviados) * 100 : 35,
      emailReply: emailMetrics.emailsAbiertos > 0 ? (emailMetrics.emailsRespondidos / emailMetrics.emailsAbiertos) * 100 : 10,
      prospectContact: prospectMetrics.prospectosGenerados > 0 ? (prospectMetrics.prospectosContactados / prospectMetrics.prospectosGenerados) * 100 : 30,
      closeRate: prospectMetrics.reunionesRealizadas > 0 ? (prospectMetrics.ventas / prospectMetrics.reunionesRealizadas) * 100 : 20,
    };
  }, [callMetrics, emailMetrics, prospectMetrics]);

  // Focus diagnoses
  const focusAreas = useMemo(() => {
    const areas = [];
    if (conversionRates.callConnection < 40) areas.push("Llamadas (Bajo contacto)");
    if (conversionRates.emailReply < 8) areas.push("Email (Baja respuesta)");
    if (conversionRates.prospectContact < 25) areas.push("LinkedIn (Aceptación)");
    if (conversionRates.closeRate < 15) areas.push("Cierre (AE)");
    return areas;
  }, [conversionRates]);

  const generateDayBlocks = (dayIndex: number): TimeBlock[] => {
    const blocks: TimeBlock[] = [];
    const needsCalls = conversionRates.callConnection < 40 || conversionRates.callMeeting < 10;
    const needsEmails = conversionRates.emailReply < 8;
    const needsProspecting = conversionRates.prospectContact < 25;

    // Different blocks for different days for variety (0 = Lunes, 1 = Martes, etc.)
    if (dayIndex === 0 || dayIndex === 3) {
      // Monday & Thursday: Outbound phone focus
      blocks.push({
        startTime: "09:00",
        endTime: "10:00",
        activity: "Prospección y Lista de Contactos",
        category: "prospecting",
        priority: needsProspecting ? "high" : "medium",
        iconKey: "users",
        color: "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400",
        notes: "Investiga decisores y arma tu lista de llamadas para hoy.",
      });
      blocks.push({
        startTime: "10:00",
        endTime: "11:30",
        activity: "Bloque de Llamadas en Frío",
        category: "calls",
        priority: "high",
        iconKey: "phone",
        color: "bg-primary/10 border-primary/30 text-primary",
        notes: "Meta: 15-20 llamadas enfocadas en decisores sin distracciones.",
      });
      blocks.push({
        startTime: "11:30",
        endTime: "12:00",
        activity: "Seguimiento por Email",
        category: "emails",
        priority: "medium",
        iconKey: "mail",
        color: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
        notes: "Envía correos personalizados a quienes no te contestaron la llamada.",
      });
    } else if (dayIndex === 1 || dayIndex === 4) {
      // Tuesday & Friday: Outbound email/LinkedIn & closing
      blocks.push({
        startTime: "09:00",
        endTime: "10:00",
        activity: "Revisión de CRM y Pipeline",
        category: "admin",
        priority: "medium",
        iconKey: "target",
        color: "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400",
        notes: "Revisa tareas de seguimiento pendientes e historial.",
      });
      blocks.push({
        startTime: "10:00",
        endTime: "11:00",
        activity: "Campaña de Email Outreach",
        category: "emails",
        priority: needsEmails ? "high" : "medium",
        iconKey: "mail",
        color: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
        notes: "Envía 30 correos personalizados o secuencias automáticas.",
      });
      blocks.push({
        startTime: "11:00",
        endTime: "12:00",
        activity: "LinkedIn Social Outreach",
        category: "prospecting",
        priority: "medium",
        iconKey: "users",
        color: "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400",
        notes: "Conecta con 15 decisores y escribe notas de valor personalizadas.",
      });
    } else {
      // Wednesday: Mixed prospecting & networking
      blocks.push({
        startTime: "09:00",
        endTime: "09:30",
        activity: "Planificación y Métricas",
        category: "admin",
        priority: "low",
        iconKey: "target",
        color: "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400",
        notes: "Alinea tu cuota semanal de leads vs tu ritmo real.",
      });
      blocks.push({
        startTime: "09:30",
        endTime: "10:30",
        activity: "LinkedIn Networking",
        category: "prospecting",
        priority: "medium",
        iconKey: "users",
        color: "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400",
        notes: "Interactúa con publicaciones de tus cuentas clave y comparte valor.",
      });
      blocks.push({
        startTime: "10:30",
        endTime: "12:00",
        activity: "Llamadas de Seguimiento",
        category: "calls",
        priority: "high",
        iconKey: "phone",
        color: "bg-primary/10 border-primary/30 text-primary",
        notes: "Llama a prospectos calificados para cerrar demos agendadas.",
      });
    }

    // Lunch (All days)
    blocks.push({
      startTime: "13:00",
      endTime: "14:00",
      activity: "Almuerzo y Desconexión",
      category: "break",
      priority: "low",
      iconKey: "coffee",
      color: "bg-pink-500/10 border-pink-500/30 text-pink-600 dark:text-pink-400",
      notes: "Almuerza y descansa para mantener la energía por la tarde.",
    });

    // Afternoon blocks (Meetings & Closing Focus)
    if (dayIndex === 0 || dayIndex === 2) {
      blocks.push({
        startTime: "14:00",
        endTime: "16:00",
        activity: "Demos / Reuniones de Descubrimiento",
        category: "meetings",
        priority: "high",
        iconKey: "calendar",
        color: "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400",
        notes: "Espacio protegido para demostraciones de producto y propuestas.",
      });
      blocks.push({
        startTime: "16:00",
        endTime: "17:30",
        activity: "Propuestas y Seguimiento de Cierre",
        category: "admin",
        priority: "high",
        iconKey: "target",
        color: "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400",
        notes: "Envía propuestas de demos de hoy y haz seguimiento comercial.",
      });
    } else if (dayIndex === 1 || dayIndex === 3) {
      blocks.push({
        startTime: "14:00",
        endTime: "15:00",
        activity: "Llamadas de Cierre y Contratos",
        category: "calls",
        priority: "high",
        iconKey: "phone",
        color: "bg-primary/10 border-primary/30 text-primary",
        notes: "Llama a decisores con propuestas enviadas para empujar la firma.",
      });
      blocks.push({
        startTime: "15:00",
        endTime: "17:00",
        activity: "Demos / Presentación de Propuesta",
        category: "meetings",
        priority: "high",
        iconKey: "calendar",
        color: "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400",
        notes: "Espacio de calendario reservado para demos comerciales.",
      });
    } else {
      // Friday Afternoon: Admin & Weekly Wrap Up
      blocks.push({
        startTime: "14:00",
        endTime: "15:00",
        activity: "Seguimiento y Cierre Q",
        category: "calls",
        priority: "medium",
        iconKey: "phone",
        color: "bg-primary/10 border-primary/30 text-primary",
        notes: "Último empujón telefónico para propuestas calientes.",
      });
      blocks.push({
        startTime: "15:00",
        endTime: "16:30",
        activity: "Revisión Semanal y CRM Clean",
        category: "admin",
        priority: "medium",
        iconKey: "target",
        color: "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400",
        notes: "Actualiza el pipeline en Supabase, limpia registros y planifica la semana que viene.",
      });
    }

    // End of day (Common)
    blocks.push({
      startTime: "17:30",
      endTime: "18:00",
      activity: "Cierre del Día y Plan Mañana",
      category: "admin",
      priority: "low",
      iconKey: "clock",
      color: "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400",
      notes: "Bloquea tu agenda de mañana y deja lista tu lista de outreach.",
    });

    return blocks;
  };

  const currentDayBlocks = useMemo(() => {
    return generateDayBlocks(selectedDayIndex);
  }, [selectedDayIndex, conversionRates]);

  const daysLabels = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

  // Export to Excel
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    daysLabels.forEach((day, idx) => {
      const dayBlocks = generateDayBlocks(idx);
      const data = dayBlocks.map((block) => ({
        "Hora Inicio": block.startTime,
        "Hora Fin": block.endTime,
        Actividad: block.activity,
        Categoria: block.category,
        Prioridad: block.priority,
        Notas: block.notes,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, day);
    });

    XLSX.writeFile(wb, `Plan-TimeBlocking-Ventas-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF("landscape");
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Plan de Time Blocking Semanal (Ventas B2B)", pageWidth / 2, 15, { align: "center" });

    let yOffset = 30;
    
    daysLabels.forEach((day, idx) => {
      const dayBlocks = generateDayBlocks(idx);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(day, 20, yOffset);
      yOffset += 6;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      dayBlocks.forEach((block) => {
        if (block.category === "break") return; // Skip lunch in PDF to fit
        const text = `${block.startTime} - ${block.endTime} | ${block.activity} | ${block.notes}`;
        doc.text(text, 25, yOffset);
        yOffset += 5.5;
        
        if (yOffset > 185) {
          doc.addPage();
          yOffset = 25;
        }
      });
      yOffset += 5;
    });

    doc.save(`Calendario-TimeBlocking-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  // Export to ICS File
  const generateICSFile = () => {
    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Tono Dashboard//Sales Time Blocking//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];

    const today = new Date();
    const monday = new Date(today);
    const currentDay = today.getDay();
    const distanceToMonday = (1 - currentDay + 7) % 7;
    monday.setDate(today.getDate() + distanceToMonday);

    daysLabels.forEach((_, dayIdx) => {
      const dayBlocks = generateDayBlocks(dayIdx);
      const targetDate = new Date(monday);
      targetDate.setDate(monday.getDate() + dayIdx);

      dayBlocks.forEach((block) => {
        const [startHour, startMin] = block.startTime.split(":").map(Number);
        const [endHour, endMin] = block.endTime.split(":").map(Number);

        const startDate = new Date(targetDate);
        startDate.setHours(startHour, startMin, 0, 0);
        
        const endDate = new Date(targetDate);
        endDate.setHours(endHour, endMin, 0, 0);

        const formatICSDate = (date: Date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

        lines.push("BEGIN:VEVENT");
        lines.push(`UID:${formatICSDate(startDate)}-${dayIdx}-${block.startTime.replace(":", "")}@tonodashboard`);
        lines.push(`DTSTAMP:${formatICSDate(new Date())}`);
        lines.push(`DTSTART:${formatICSDate(startDate)}`);
        lines.push(`DTEND:${formatICSDate(endDate)}`);
        lines.push(`SUMMARY:${block.activity}`);
        lines.push(`DESCRIPTION:${block.notes}`);
        lines.push("END:VEVENT");
      });
    });

    lines.push("END:VCALENDAR");
    const icsContent = lines.join("\r\n");
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Ventas-TimeBlocking-${new Date().toISOString().split("T")[0]}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    selectedDayIndex,
    setSelectedDayIndex,
    conversionRates,
    focusAreas,
    currentDayBlocks,
    daysLabels,
    exportToExcel,
    exportToPDF,
    generateICSFile
  };
};
