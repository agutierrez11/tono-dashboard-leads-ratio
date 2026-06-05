import React, { useState, useEffect } from "react";
import { useSalesFunnelMetrics, Anomaly } from "@/hooks/useSalesFunnelMetrics";
import { useUpdateAnomalyNotes } from "@/hooks/useActivities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, MessageSquare, Save, CheckCircle2, History, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const AnomalyTracker: React.FC = () => {
  const { metrics, isLoading } = useSalesFunnelMetrics(30);
  const { mutate: updateNotes, isPending } = useUpdateAnomalyNotes();
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  const anomalies = metrics?.anomalies ?? [];

  // Initialize edit states when anomalies load
  useEffect(() => {
    if (anomalies.length > 0) {
      const initialStates: Record<string, string> = {};
      anomalies.forEach((anomaly) => {
        initialStates[anomaly.activityDate] = anomaly.note ?? "";
      });
      setEditingNotes((prev) => ({ ...initialStates, ...prev }));
    }
  }, [anomalies]);

  const handleNoteChange = (date: string, value: string) => {
    setEditingNotes((prev) => ({
      ...prev,
      [date]: value,
    }));
  };

  const handleSave = (date: string) => {
    const noteText = editingNotes[date] ?? "";
    updateNotes({ activityDate: date, notes: noteText });
  };

  if (isLoading) {
    return (
      <div className="w-full h-48 flex items-center justify-center rounded-xl border border-white/10 bg-background/20 backdrop-blur-md animate-pulse">
        <span className="text-muted-foreground text-sm">Cargando registro de anomalías...</span>
      </div>
    );
  }

  return (
    <Card className="glass-card border border-white/10 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
          <CardTitle className="text-lg font-bold tracking-tight text-white">
            Registro de Hitos y Desviaciones (Anomalías)
          </CardTitle>
        </div>
        <CardDescription className="text-muted-foreground">
          El sistema identifica automáticamente días con brotes inusuales de agendamiento de reuniones (desviación estadística &gt; 1.5σ).
          Añade tus anotaciones libremente para catalogar qué causó cada evento.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {anomalies.length === 0 ? (
          <Alert className="bg-slate-950/20 border-white/5 text-muted-foreground">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-xs">
              No se han detectado desviaciones atípicas en los últimos 30 días. Todo marcha bajo el promedio esperado.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {anomalies.map((anomaly) => {
              const formattedDate = format(new Date(anomaly.activityDate + "T12:00:00"), "EEEE, d 'de' MMMM", { locale: es });
              const currentText = editingNotes[anomaly.activityDate] ?? "";
              const hasChanged = currentText !== (anomaly.note ?? "");

              return (
                <div
                  key={anomaly.activityDate}
                  className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-300 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold capitalize text-white">
                        {formattedDate}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/15 border-amber-500/20 text-[10px] font-bold">
                          Spike: {anomaly.meetingsBooked} reuniones
                        </Badge>
                        <Badge variant="outline" className="text-[9px] text-muted-foreground border-white/5 font-normal">
                          Z-Score: +{anomaly.zScore}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {anomaly.note ? (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Catalogado
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400/80 flex items-center gap-1">
                          <History className="h-3 w-3 animate-spin" /> Sin catalogar
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <MessageSquare className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
                      <Input
                        value={currentText}
                        onChange={(e) => handleNoteChange(anomaly.activityDate, e.target.value)}
                        placeholder="Escribe libremente qué causó esta anomalía hoy (ej. Campaña LinkedIn, Reactivación, etc.)"
                        className="pl-9 text-xs bg-slate-950/40 border-white/10 text-white placeholder:text-muted-foreground/40 focus:border-primary/50 transition-colors h-9"
                      />
                    </div>
                    {(hasChanged || !anomaly.note) && (
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleSave(anomaly.activityDate)}
                        className="h-9 gap-1.5 bg-primary hover:bg-primary/95 text-white text-xs font-semibold shrink-0"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Guardar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
