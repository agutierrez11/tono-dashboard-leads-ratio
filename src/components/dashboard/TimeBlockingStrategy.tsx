import React, { useState, useMemo } from "react";
import { useFunnelMetrics } from "@/contexts/FunnelMetricsContext";
import { useSalesFunnelMetrics } from "@/hooks/useSalesFunnelMetrics";
import { Clock, Download, FileSpreadsheet, FileText, Phone, Mail, Users, Coffee, Target, Calendar, TrendingUp, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { Badge } from "@/components/ui/badge";

interface TimeBlock {
  startTime: string;
  endTime: string;
  activity: string;
  category: "prospecting" | "calls" | "emails" | "meetings" | "admin" | "break";
  priority: "high" | "medium" | "low";
  icon: React.ReactNode;
  color: string;
  notes: string;
}

export const TimeBlockingStrategy: React.FC = () => {
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
        icon: <Users className="w-4 h-4 text-orange-500" />,
        color: "bg-orange-500/10 border-orange-500/30",
        notes: "Investiga decisores y arma tu lista de llamadas para hoy.",
      });
      blocks.push({
        startTime: "10:00",
        endTime: "11:30",
        activity: "Bloque de Llamadas en Frío",
        category: "calls",
        priority: "high",
        icon: <Phone className="w-4 h-4 text-primary" />,
        color: "bg-primary/10 border-primary/30",
        notes: "Meta: 15-20 llamadas enfocadas en decisores sin distracciones.",
      });
      blocks.push({
        startTime: "11:30",
        endTime: "12:00",
        activity: "Seguimiento por Email",
        category: "emails",
        priority: "medium",
        icon: <Mail className="w-4 h-4 text-amber-500" />,
        color: "bg-amber-500/10 border-amber-500/30",
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
        icon: <Target className="w-4 h-4 text-purple-500" />,
        color: "bg-purple-500/10 border-purple-500/30",
        notes: "Revisa tareas de seguimiento pendientes e historial.",
      });
      blocks.push({
        startTime: "10:00",
        endTime: "11:00",
        activity: "Campaña de Email Outreach",
        category: "emails",
        priority: needsEmails ? "high" : "medium",
        icon: <Mail className="w-4 h-4 text-amber-500" />,
        color: "bg-amber-500/10 border-amber-500/30",
        notes: "Envía 30 correos personalizados o secuencias automáticas.",
      });
      blocks.push({
        startTime: "11:00",
        endTime: "12:00",
        activity: "LinkedIn Social Outreach",
        category: "prospecting",
        priority: "medium",
        icon: <Users className="w-4 h-4 text-orange-500" />,
        color: "bg-orange-500/10 border-orange-500/30",
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
        icon: <Target className="w-4 h-4 text-purple-500" />,
        color: "bg-purple-500/10 border-purple-500/30",
        notes: "Alinea tu cuota semanal de leads vs tu ritmo real.",
      });
      blocks.push({
        startTime: "09:30",
        endTime: "10:30",
        activity: "LinkedIn Networking",
        category: "prospecting",
        priority: "medium",
        icon: <Users className="w-4 h-4 text-orange-500" />,
        color: "bg-orange-500/10 border-orange-500/30",
        notes: "Interactúa con publicaciones de tus cuentas clave y comparte valor.",
      });
      blocks.push({
        startTime: "10:30",
        endTime: "12:00",
        activity: "Llamadas de Seguimiento",
        category: "calls",
        priority: "high",
        icon: <Phone className="w-4 h-4 text-primary" />,
        color: "bg-primary/10 border-primary/30",
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
      icon: <Coffee className="w-4 h-4 text-pink-500" />,
      color: "bg-pink-500/10 border-pink-500/30",
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
        icon: <Calendar className="w-4 h-4 text-green-500" />,
        color: "bg-green-500/10 border-green-500/30",
        notes: "Espacio protegido para demostraciones de producto y propuestas.",
      });
      blocks.push({
        startTime: "16:00",
        endTime: "17:30",
        activity: "Propuestas y Seguimiento de Cierre",
        category: "admin",
        priority: "high",
        icon: <Target className="w-4 h-4 text-purple-500" />,
        color: "bg-purple-500/10 border-purple-500/30",
        notes: "Envía propuestas de demos de hoy y haz seguimiento comercial.",
      });
    } else if (dayIndex === 1 || dayIndex === 3) {
      blocks.push({
        startTime: "14:00",
        endTime: "15:00",
        activity: "Llamadas de Cierre y Contratos",
        category: "calls",
        priority: "high",
        icon: <Phone className="w-4 h-4 text-primary" />,
        color: "bg-primary/10 border-primary/30",
        notes: "Llama a decisores con propuestas enviadas para empujar la firma.",
      });
      blocks.push({
        startTime: "15:00",
        endTime: "17:00",
        activity: "Demos / Presentación de Propuesta",
        category: "meetings",
        priority: "high",
        icon: <Calendar className="w-4 h-4 text-green-500" />,
        color: "bg-green-500/10 border-green-500/30",
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
        icon: <Phone className="w-4 h-4 text-primary" />,
        color: "bg-primary/10 border-primary/30",
        notes: "Último empujón telefónico para propuestas calientes.",
      });
      blocks.push({
        startTime: "15:00",
        endTime: "16:30",
        activity: "Revisión Semanal y CRM Clean",
        category: "admin",
        priority: "medium",
        icon: <Target className="w-4 h-4 text-purple-500" />,
        color: "bg-purple-500/10 border-purple-500/30",
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
      icon: <Clock className="w-4 h-4 text-purple-500" />,
      color: "bg-purple-500/10 border-purple-500/30",
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
    // Find next Monday
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "prospecting": return "bg-orange-500/20 text-orange-700 border-orange-500/30";
      case "calls": return "bg-[#3b82f6]/20 text-blue-700 border-blue-500/30";
      case "emails": return "bg-amber-100/50 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/35";
      case "meetings": return "bg-[#22c55e]/20 text-green-700 border-green-500/30";
      case "admin": return "bg-purple-500/20 text-purple-700 border-purple-500/30";
      case "break": return "bg-pink-500/10 text-pink-700 border-pink-500/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Alert Focus Areas */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            Estrategia de Prospección Sugerida
          </h4>
          <p className="text-xs text-muted-foreground">
            Los bloques de tiempo se adaptan y priorizan en base a los cuellos de botella de tu embudo.
          </p>
        </div>
        {focusAreas.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {focusAreas.map((area) => (
              <Badge key={area} variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px]">
                Enfoque: {area}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Days Navigation and Calendar Block */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex border-b border-border pb-1 gap-1 overflow-x-auto">
            {daysLabels.map((day, idx) => (
              <Button
                key={day}
                variant={selectedDayIndex === idx ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedDayIndex(idx)}
                className="h-8 text-xs shrink-0"
              >
                {day}
              </Button>
            ))}
          </div>

          {/* Timeline Blocks */}
          <div className="space-y-3">
            {currentDayBlocks.map((block, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors ${block.color}`}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-foreground bg-background px-2 py-0.5 rounded shadow-sm">
                      {block.startTime} - {block.endTime}
                    </span>
                    <span className="text-xs font-bold text-foreground flex items-center gap-1">
                      {block.activity}
                    </span>
                    <Badge variant="outline" className="text-[9px] uppercase px-1 h-4">
                      {block.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{block.notes}</p>
                </div>
                {block.category !== "break" && (
                  <Badge className="text-[9px] h-4 uppercase shrink-0">
                    Prioridad: {block.priority === "high" ? "Alta" : block.priority === "medium" ? "Media" : "Baja"}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sync & Export Options */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider block">Exportar Horarios</span>
              <p className="text-[10px] text-muted-foreground">Exporta tu planificador semanal para integrarlo en tu día a día.</p>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={generateICSFile} 
                variant="outline" 
                size="sm" 
                className="w-full justify-start text-xs h-9 gap-2"
              >
                <Calendar className="h-4 w-4 text-primary" />
                Descargar Archivo .ICS (iCal)
              </Button>
              <Button 
                onClick={exportToPDF} 
                variant="outline" 
                size="sm" 
                className="w-full justify-start text-xs h-9 gap-2"
              >
                <FileText className="h-4 w-4 text-red-500" />
                Exportar PDF para Imprimir
              </Button>
              <Button 
                onClick={exportToExcel} 
                variant="outline" 
                size="sm" 
                className="w-full justify-start text-xs h-9 gap-2"
              >
                <FileSpreadsheet className="h-4 w-4 text-green-500" />
                Exportar a Excel (.xlsx)
              </Button>
            </div>
          </div>

          {/* Tips for Sales Ops */}
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider text-accent-foreground">Beneficio del Time-Blocking</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              El time-blocking te ayuda a enfocar tu tiempo y eliminar el multi-tasking, protegiendo tus horas de prospección activa y llamadas de cierre de las interrupciones del día a día.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
