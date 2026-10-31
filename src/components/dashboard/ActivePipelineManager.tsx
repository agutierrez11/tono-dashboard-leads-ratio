import React from "react";
import { useMeliCockpit } from "@/hooks/useMeliCockpit";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Phone,
  MessageSquare,
  Building2,
  ExternalLink,
  Layers,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { LeadStage, TouchType } from "@/types/crm";
import { toast } from "sonner";

export const ActivePipelineManager: React.FC = () => {
  const { activeLeads, addTouch, updateStage, activateNextBatch } = useMeliCockpit();

  const handleQuickTouch = (leadId: string, company: string, type: TouchType, phone?: string) => {
    addTouch(leadId, type, `Toque registrado desde Tablero Diario (${type})`);

    if (type === "whatsapp" && phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      const waNumber = cleanPhone.startsWith("52") ? cleanPhone : `52${cleanPhone}`;
      window.open(`https://wa.me/${waNumber}?text=Hola,%20mucho%20gusto`, "_blank");
    } else if (type === "call" && phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  return (
    <Card className="border shadow-sm bg-card">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-bold text-foreground">
                Pipeline Activo en Gestión • Tus Cuentas en Curso
              </CardTitle>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
                {activeLeads.length} cuentas activas
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Cambia la etapa comercial de cada cuenta para mover el Embudo de 4 Etapas o registra toques rápidos para mover el tacómetro.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => activateNextBatch(10)}
              className="text-xs h-8 border-primary/30 text-primary hover:bg-primary/5"
            >
              <Layers className="h-3.5 w-3.5 mr-1.5" />
              +10 Leads del Banco
            </Button>
            <Link to="/leads-list">
              <Button size="sm" variant="ghost" className="text-xs h-8 text-muted-foreground hover:text-foreground">
                Ver Directorio Completo <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {activeLeads.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Layers className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">
              No tienes prospectos en tu mesa de trabajo hoy
            </h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Activa un lote de 10 prospectos seleccionados del Banco Maestro de Quintana Roo para comenzar tu jornada comercial.
            </p>
            <Button
              size="sm"
              onClick={() => activateNextBatch(10)}
              className="bg-primary text-primary-foreground text-xs"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Activar Primer Lote de 10 Prospectos
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground border-b font-medium">
                <tr>
                  <th className="py-2.5 px-3">Comercio / Contacto</th>
                  <th className="py-2.5 px-3">Giro & Zona</th>
                  <th className="py-2.5 px-3 text-center">Toques Rápidos (Mueve Tacómetro)</th>
                  <th className="py-2.5 px-3">Etapa Comercial (Mueve el Embudo)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {activeLeads.slice(0, 10).map((lead) => {
                  const touchCountToday = lead.touches.filter(
                    (t) => new Date(t.date).toDateString() === new Date().toDateString()
                  ).length;

                  return (
                    <tr key={lead.id} className="hover:bg-muted/20 transition-colors">
                      {/* 1. Empresa & Contacto */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-foreground text-xs">
                          {lead.company || lead.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span>{lead.contact_person || "Dueño / Encargado"}</span>
                          {lead.phone && (
                            <span className="font-mono text-[10px] text-slate-500">
                              • {lead.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Giro & Zona */}
                      <td className="py-2.5 px-3">
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                          {lead.industry || "Comercio"}
                        </Badge>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px]">{lead.city || "Quintana Roo"}</span>
                        </div>
                      </td>

                      {/* 3. Acciones de Toque Rápido */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuickTouch(lead.id, lead.company, "cambaceo")}
                            className="h-7 px-2 text-[11px] border-purple-500/30 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400"
                            title="Registrar visita en calle (+1 en tacómetro)"
                          >
                            <MapPin className="h-3 w-3 mr-1" />
                            Visita
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuickTouch(lead.id, lead.company, "whatsapp", lead.phone)}
                            className="h-7 px-2 text-[11px] border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            title="Abrir WhatsApp y registrar toque (+1 en tacómetro)"
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            WhatsApp
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuickTouch(lead.id, lead.company, "call", lead.phone)}
                            className="h-7 px-2 text-[11px] border-blue-500/30 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            title="Llamar y registrar toque (+1 en tacómetro)"
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Llamar
                          </Button>
                        </div>
                        {touchCountToday > 0 && (
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium block mt-1">
                            ✓ {touchCountToday} toque{touchCountToday > 1 ? "s" : ""} registrado{touchCountToday > 1 ? "s" : ""} hoy
                          </span>
                        )}
                      </td>

                      {/* 4. Selector de Etapa Comercial */}
                      <td className="py-2.5 px-3">
                        <div className="w-[185px]">
                          <Select
                            value={lead.stage}
                            onValueChange={(val) => updateStage(lead.id, val as LeadStage)}
                          >
                            <SelectTrigger className="h-7 text-[11px] bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new" className="text-xs">
                                1. Prospecto (Sin contacto)
                              </SelectItem>
                              <SelectItem value="contacted" className="text-xs text-amber-600">
                                2. Contactado / Lead
                              </SelectItem>
                              <SelectItem value="visit" className="text-xs text-purple-600">
                                3. Cita / En Visita
                              </SelectItem>
                              <SelectItem value="proposal" className="text-xs text-orange-600">
                                3. Propuesta Entregada
                              </SelectItem>
                              <SelectItem value="negotiation" className="text-xs text-indigo-600">
                                3. En Negociación de Tasa
                              </SelectItem>
                              <SelectItem value="won" className="text-xs font-semibold text-emerald-600">
                                4. Ganado / Terminal Cerrada
                              </SelectItem>
                              <SelectItem value="lost" className="text-xs text-rose-600">
                                Descartado / Sin Interés
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

        {activeLeads.length > 10 && (
          <div className="p-2.5 bg-muted/20 border-t text-center text-xs text-muted-foreground">
            Mostrando las primeras 10 cuentas de {activeLeads.length} en gestión.{" "}
            <Link to="/leads-list" className="text-primary hover:underline font-semibold ml-1">
              Ver todas en Pipeline Completo ➔
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
