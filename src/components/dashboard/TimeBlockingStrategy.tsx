import React from "react";
import { 
  Clock, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Phone, 
  Mail, 
  Users, 
  Coffee, 
  Target, 
  Calendar, 
  AlertCircle, 
  Sparkles 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTimeBlocking } from "@/hooks/useTimeBlocking";

export const TimeBlockingStrategy: React.FC = () => {
  const {
    selectedDayIndex,
    setSelectedDayIndex,
    focusAreas,
    currentDayBlocks,
    daysLabels,
    exportToExcel,
    exportToPDF,
    generateICSFile
  } = useTimeBlocking();

  const getIcon = (iconKey: string) => {
    switch (iconKey) {
      case "users": return <Users className="w-4 h-4 text-orange-500" />;
      case "phone": return <Phone className="w-4 h-4 text-primary" />;
      case "mail": return <Mail className="w-4 h-4 text-amber-500" />;
      case "target": return <Target className="w-4 h-4 text-purple-500" />;
      case "coffee": return <Coffee className="w-4 h-4 text-pink-500" />;
      case "calendar": return <Calendar className="w-4 h-4 text-green-500" />;
      case "clock": return <Clock className="w-4 h-4 text-purple-500" />;
      default: return <Target className="w-4 h-4 text-muted-foreground" />;
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
              <Badge key={area} variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] font-bold">
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
                className={`p-3 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors ${block.color}`}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-foreground bg-background px-2 py-0.5 rounded shadow-sm">
                      {block.startTime} - {block.endTime}
                    </span>
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      {getIcon(block.iconKey)}
                      {block.activity}
                    </span>
                    <Badge variant="outline" className="text-[9px] uppercase px-1.5 h-4 border-foreground/10 bg-background/50">
                      {block.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-1">{block.notes}</p>
                </div>
                {block.category !== "break" && (
                  <Badge className="text-[9px] h-4 uppercase shrink-0 font-bold">
                    Prioridad: {block.priority === "high" ? "Alta" : block.priority === "medium" ? "Media" : "Baja"}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sync & Export Options */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-4 shadow-sm">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider block">Exportar Horarios</span>
              <p className="text-[10px] text-muted-foreground">Exporta tu planificador semanal para integrarlo en tu día a día.</p>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={generateICSFile} 
                variant="outline" 
                size="sm" 
                className="w-full justify-start text-xs h-9 gap-2 hover:bg-accent transition-colors"
              >
                <Calendar className="h-4 w-4 text-primary" />
                Descargar Archivo .ICS (iCal)
              </Button>
              <Button 
                onClick={exportToPDF} 
                variant="outline" 
                size="sm" 
                className="w-full justify-start text-xs h-9 gap-2 hover:bg-accent transition-colors"
              >
                <FileText className="h-4 w-4 text-red-500" />
                Exportar PDF para Imprimir
              </Button>
              <Button 
                onClick={exportToExcel} 
                variant="outline" 
                size="sm" 
                className="w-full justify-start text-xs h-9 gap-2 hover:bg-accent transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4 text-green-500" />
                Exportar a Excel (.xlsx)
              </Button>
            </div>
          </div>

          {/* Tips for Sales Ops */}
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-accent animate-pulse" />
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
