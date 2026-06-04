import React, { useState } from "react";
import { useSalesFunnelMetrics } from "@/hooks/useSalesFunnelMetrics";
import { useWeeklyNotes, useSaveWeeklyNote } from "@/hooks/useWeeklyNotes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LineChart, Line } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Award, DollarSign, Activity, MessageSquare, Save, Edit2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const WeeklyPerformanceTimeline: React.FC = () => {
  const { metrics, isLoading: metricsLoading } = useSalesFunnelMetrics(0); // Fetch all-time / full historical
  const { data: weeklyNotes = [], isLoading: notesLoading } = useWeeklyNotes();
  const saveNoteMutation = useSaveWeeklyNote();

  const [editingWeek, setEditingWeek] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState<string>("");

  if (metricsLoading || notesLoading) {
    return (
      <div className="w-full h-96 flex items-center justify-center rounded-xl border border-white/10 bg-background/20 backdrop-blur-md animate-pulse">
        <span className="text-muted-foreground text-sm">Cargando línea del tiempo y analíticas históricas...</span>
      </div>
    );
  }

  const summaries = metrics?.weeklySummaries || [];

  // Map notes by week start date for quick lookup
  const notesByWeek = new Map<string, string>();
  weeklyNotes.forEach((n) => {
    notesByWeek.set(n.week_start_date, n.notes);
  });

  const chartData = summaries.map((s) => ({
    name: s.weekLabel.replace("Semana ", ""),
    "Ingresos ($)": s.revenue,
    "Contactos Totales": s.callsMade + s.emailsSent + s.linkedinContacts,
    "Llamadas": s.callsMade,
    "Emails": s.emailsSent,
    "LinkedIn": s.linkedinContacts,
    "Ventas": s.salesCount,
    "Reuniones": s.meetingsScheduled,
  }));

  const handleEditNote = (weekStart: string, currentText: string) => {
    setEditingWeek(weekStart);
    setTempNoteText(currentText);
  };

  const handleSaveNote = async (weekStart: string) => {
    try {
      await saveNoteMutation.mutateAsync({
        weekStartDate: weekStart,
        notes: tempNoteText,
      });
      setEditingWeek(null);
    } catch (error) {
      console.error("Error saving week note:", error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Chart Section */}
      <Card className="border border-white/10 bg-gradient-to-b from-slate-900/60 to-slate-950/60 backdrop-blur-md">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-400" />
                Historial de Desempeño (Últimas 12 Semanas)
              </CardTitle>
              <CardDescription className="text-slate-400">
                Relación de ingresos generados vs. esfuerzo total de prospección semanal.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                Ingresos vs Prospección
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.4)" 
                  fontSize={11} 
                  tickLine={false} 
                />
                <YAxis 
                  yAxisId="left"
                  stroke="rgba(255,255,255,0.4)" 
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="rgba(255,255,255,0.4)" 
                  fontSize={11}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(15, 23, 42, 0.9)", 
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#fff"
                  }}
                  itemStyle={{ fontSize: "12px" }}
                  labelStyle={{ fontWeight: "bold", fontSize: "12px", marginBottom: "4px" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="Ingresos ($)" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
                <Area 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="Contactos Totales" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorActivity)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 px-1">
          <Calendar className="h-5 w-5 text-emerald-400" />
          Bitácora Semanal y Evolución Comercial
        </h3>
        
        {summaries.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-white/5 bg-white/[0.01]">
            <p className="text-muted-foreground text-sm">No hay datos históricos suficientes para mostrar la bitácora.</p>
          </div>
        ) : (
          <div className="relative border-l border-white/10 pl-6 ml-4 space-y-6">
            {summaries.map((week, idx) => {
              const noteText = notesByWeek.get(week.weekStart) || "";
              const isEditing = editingWeek === week.weekStart;

              // Color of the timeline bullet
              const isCurrentWeek = idx === summaries.length - 1;
              
              let channelLabel = "Ninguno";
              let channelClass = "bg-slate-500/10 text-slate-400 border-slate-500/20";
              if (week.starChannel === "linkedin") {
                channelLabel = "LinkedIn";
                channelClass = "bg-blue-500/10 text-blue-400 border-blue-500/20";
              } else if (week.starChannel === "phone") {
                channelLabel = "Llamadas";
                channelClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
              } else if (week.starChannel === "email") {
                channelLabel = "Emails";
                channelClass = "bg-purple-500/10 text-purple-400 border-purple-500/20";
              }

              return (
                <div key={week.weekStart} className="relative group">
                  {/* Timeline bullet dot */}
                  <div 
                    className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-slate-950 transition-all ${
                      isCurrentWeek 
                        ? "border-primary shadow-[0_0_8px_rgba(var(--primary),0.5)] scale-110" 
                        : "border-white/20 group-hover:border-white/50"
                    }`}
                  />

                  {/* Glassmorphic card */}
                  <Card className="border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] backdrop-blur-sm transition-all duration-300">
                    <CardContent className="p-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Title and date */}
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-white text-base">
                            {week.weekLabel}
                          </span>
                          {isCurrentWeek && (
                            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-[10px] py-0 px-2">
                              Semana Activa
                            </Badge>
                          )}
                          <Badge variant="outline" className={`text-[10px] py-0 px-2 ${channelClass}`}>
                            Canal Estrella: {channelLabel}
                          </Badge>
                        </div>

                        {/* Financial summary */}
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <span className="text-[10px] block text-muted-foreground uppercase tracking-wider font-semibold">
                              Ingresos Cerrados
                            </span>
                            <span className="text-emerald-400 font-bold flex items-center justify-end text-sm gap-0.5">
                              <DollarSign className="h-3.5 w-3.5" />
                              {week.revenue.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-right border-l border-white/10 pl-6">
                            <span className="text-[10px] block text-muted-foreground uppercase tracking-wider font-semibold">
                              Ventas / Reuniones
                            </span>
                            <span className="text-white font-medium text-sm">
                              {week.salesCount} / {week.meetingsScheduled}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Outreach Activities Bar Grid */}
                      <div className="grid grid-cols-3 gap-2 mt-4 py-3 border-y border-white/5 text-xs text-muted-foreground">
                        <div>
                          <span className="block font-medium text-[10px] text-muted-foreground/60">LLAMADAS</span>
                          <span className="text-white font-semibold">{week.callsMade}</span>
                          <span className="text-[10px] text-muted-foreground ml-1">
                            ({Math.round(week.rates.phoneConnection)}% conec.)
                          </span>
                        </div>
                        <div>
                          <span className="block font-medium text-[10px] text-muted-foreground/60">CORREOS</span>
                          <span className="text-white font-semibold">{week.emailsSent}</span>
                          <span className="text-[10px] text-muted-foreground ml-1">
                            ({Math.round(week.rates.emailReply)}% resp.)
                          </span>
                        </div>
                        <div>
                          <span className="block font-medium text-[10px] text-muted-foreground/60">LINKEDIN (CONTACTOS)</span>
                          <span className="text-white font-semibold">{week.linkedinContacts}</span>
                          <span className="text-[10px] text-muted-foreground ml-1">
                            ({Math.round(week.rates.linkedinConnect)}% acep.)
                          </span>
                        </div>
                      </div>

                      {/* Notes / Logs Section */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
                            Bitácora de Experimentos y Observaciones:
                          </span>
                          {!isEditing && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditNote(week.weekStart, noteText)}
                              className="h-7 text-[10px] text-slate-400 hover:text-white hover:bg-white/5 flex gap-1"
                            >
                              <Edit2 className="h-3 w-3" />
                              {noteText ? "Editar" : "Escribir"}
                            </Button>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-2">
                            <Textarea
                              value={tempNoteText}
                              onChange={(e) => setTempNoteText(e.target.value)}
                              placeholder="Ej. 'Probé una nueva plantilla de LinkedIn enfocada en el dolor de leads. Tuvimos un 25% de aceptación. Las llamadas en frío por la tarde tuvieron mejor respuesta.'"
                              className="min-h-[80px] bg-slate-950/60 border-white/10 text-xs text-white placeholder-slate-500 focus-visible:ring-indigo-500"
                            />
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingWeek(null)}
                                className="h-8 text-xs border-white/10 text-slate-400 hover:bg-white/5"
                              >
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSaveNote(week.weekStart)}
                                className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white flex gap-1.5"
                                disabled={saveNoteMutation.isPending}
                              >
                                <Save className="h-3.5 w-3.5" />
                                {saveNoteMutation.isPending ? "Guardando..." : "Guardar Nota"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg bg-slate-950/40 border border-white/5">
                            {noteText ? (
                              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                                {noteText}
                              </p>
                            ) : (
                              <p className="text-xs text-slate-500 italic">
                                Sin anotaciones esta semana. Haz clic en "Escribir" para apuntar qué canales rindieron mejor y qué experimentos realizaste.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
