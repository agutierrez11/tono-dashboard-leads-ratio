import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useMeliCockpit } from "@/hooks/useMeliCockpit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  Search,
  Filter,
  Phone,
  MessageSquare,
  Building2,
  Mail,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Plus,
  MapPin,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { LeadStage, TouchType, CrmLead } from "@/types/crm";
import { toast } from "sonner";
import { getIndustries } from "@/utils/industries";

const stageOptions: { value: LeadStage; label: string; color: string }[] = [
  { value: "new", label: "🆕 Nuevo", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { value: "contacted", label: "💬 Contactado", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  { value: "visit", label: "📍 Cita / Visita", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  { value: "proposal", label: "📑 Propuesta Entregada", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  { value: "negotiation", label: "🤝 Negociación", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
  { value: "won", label: "🏆 Ganado / Transaccionando", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { value: "lost", label: "❌ Descartado / Churn", color: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
];

const LeadsList = () => {
  const { activeLeads, stagingLeads, activateNextBatch, addTouch, updateStage, markUploadedToMeli } = useMeliCockpit();
  const [searchParams] = useSearchParams();
  const initialStaleFilter = searchParams.get("filter") === "stale";

  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [showStaleOnly, setShowStaleOnly] = useState(initialStaleFilter);

  // Quick touch modal
  const [touchLead, setTouchLead] = useState<CrmLead | null>(null);
  const [touchType, setTouchType] = useState<TouchType>("call");
  const [touchNote, setTouchNote] = useState("");

  const industriesList = useMemo(() => getIndustries(), []);

  const filteredLeads = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return activeLeads.filter((lead) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        lead.name.toLowerCase().includes(q) ||
        lead.company.toLowerCase().includes(q) ||
        (lead.contact_person && lead.contact_person.toLowerCase().includes(q)) ||
        (lead.phone && lead.phone.includes(q));

      const matchesIndustry = industryFilter === "all" || lead.industry === industryFilter;
      const matchesStage = stageFilter === "all" || lead.stage === stageFilter;

      let isStale = false;
      if (lead.stage !== "won" && lead.stage !== "lost") {
        const lastDate =
          lead.touches.length > 0
            ? new Date(lead.touches[lead.touches.length - 1].date)
            : new Date(lead.created_at);
        const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        isStale = diffDays >= 7;
      }

      const matchesStale = !showStaleOnly || isStale;

      return matchesSearch && matchesIndustry && matchesStage && matchesStale;
    });
  }, [activeLeads, searchTerm, industryFilter, stageFilter, showStaleOnly]);

  const handleOpenTouch = (lead: CrmLead, type: TouchType) => {
    setTouchLead(lead);
    setTouchType(type);
    setTouchNote("");
  };

  const handleSaveTouch = () => {
    if (!touchLead) return;
    addTouch(touchLead.id, touchType, touchNote);
    setTouchLead(null);
  };

  const copyForMeli = (lead: CrmLead) => {
    const text = `Cuenta: ${lead.company}
Contacto: ${lead.contact_person || "Director / Dueño"}
Teléfono: ${lead.phone}
Email: ${lead.email || "N/A"}
Dirección: ${lead.street_and_number || lead.address_full || "Quintana Roo"}
Colonia: ${lead.neighborhood || "Centro"}
C.P.: ${lead.postal_code || "77500"}
Ciudad: ${lead.city || "Cancún"}, ${lead.state || "Quintana Roo"}
Giro / Industria: ${lead.industry}
Producto MP: ${lead.product_opportunity || "Point Smart 4G"}
TPV Estimado: $${(lead.tpv_monthly || 0).toLocaleString()} MXN
Notas de Operación: ${lead.operational_pain || "Sin notas"}`;

    navigator.clipboard.writeText(text);
    toast.success("Información estructurada copiada. Lista para pegar en CRM de MELI.");
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                Pipeline Activo ({filteredLeads.length} cuentas)
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cuentas activas en gestión comercial. Registra toques rápidos y copia a MELI CRM.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs" asChild>
              <Link to="/?tab=gsheet">
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-primary" />
                Banco Google Sheets ({stagingLeads.length})
              </Link>
            </Button>
            <Button
              variant={showStaleOnly ? "destructive" : "outline"}
              size="sm"
              onClick={() => setShowStaleOnly(!showStaleOnly)}
              className="text-xs"
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
              {showStaleOnly ? "Mostrando Solo Estancados (>7d)" : "Filtrar Estancados (+7d)"}
            </Button>
            <Link to="/leads">
              <Button size="sm" className="text-xs">
                <Plus className="h-4 w-4 mr-1" /> Alta Manual
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por negocio, contacto o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="w-full md:w-[220px] text-xs">
                  <Filter className="h-3.5 w-3.5 mr-2" />
                  <SelectValue placeholder="Filtrar por industria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las industrias</SelectItem>
                  {industriesList.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-full md:w-[180px] text-xs">
                  <SelectValue placeholder="Filtrar por etapa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las etapas</SelectItem>
                  {stageOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead>Comercio / Contacto</TableHead>
                    <TableHead>Vertical / Producto</TableHead>
                    <TableHead>Teléfono / WhatsApp</TableHead>
                    <TableHead>Etapa Comercial</TableHead>
                    <TableHead className="text-center">Toques</TableHead>
                    <TableHead className="text-center">Estatus MELI</TableHead>
                    <TableHead className="text-right">Acciones Rápidas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        {activeLeads.length === 0 ? (
                          <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                            <Building2 className="h-8 w-8 text-muted-foreground/60 mb-1" />
                            <p className="text-sm font-semibold text-foreground">
                              Tu Pipeline Activo está en ceros para Noviembre
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Tienes <strong>{stagingLeads.length} comercios de Quintana Roo</strong> disponibles en tu Banco Maestro. Activa un lote de 10 para comenzar tu gestión.
                            </p>
                            <div className="pt-2">
                              <Button
                                size="sm"
                                onClick={() => activateNextBatch(10)}
                                className="text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                              >
                                ⚡ Activar Primer Lote de 10 Leads
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No se encontraron leads con los filtros seleccionados.</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const lastDate =
                        lead.touches.length > 0
                          ? new Date(lead.touches[lead.touches.length - 1].date)
                          : new Date(lead.created_at);
                      const diffDays = Math.floor(
                        (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
                      );
                      const isStale =
                        diffDays >= 7 && lead.stage !== "won" && lead.stage !== "lost";

                      return (
                        <TableRow key={lead.id} className="hover:bg-muted/10">
                          <TableCell>
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              {lead.company}
                              {isStale && (
                                <Badge variant="destructive" className="text-[10px] px-1 py-0">
                                  ⚠️ +{diffDays}d sin toque
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {lead.contact_person || "Director / Dueño"} • {lead.city}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="font-medium text-foreground">{lead.industry}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {lead.product_opportunity} • ${(lead.tpv_monthly || 0).toLocaleString()} TPV
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{lead.phone}</span>
                              {lead.whatsapp_link && (
                                <a
                                  href={lead.whatsapp_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-500 hover:text-emerald-600 font-semibold"
                                  title="Abrir chat en WhatsApp"
                                >
                                  💬 Whats
                                </a>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Select
                              value={lead.stage}
                              onValueChange={(val) => updateStage(lead.id, val as LeadStage)}
                            >
                              <SelectTrigger className="h-7 w-[160px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {stageOptions.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>

                          <TableCell className="text-center font-bold">
                            <Badge variant="secondary" className="text-xs">
                              {lead.touches.length} toques
                            </Badge>
                          </TableCell>

                          <TableCell className="text-center">
                            {lead.status_meli_crm === "Cargado en MELI CRM" ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> En MELI
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-[10px] text-muted-foreground hover:text-primary"
                                onClick={() => markUploadedToMeli(lead.id)}
                              >
                                Marcar en MELI
                              </Button>
                            )}
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7 text-purple-600 hover:bg-purple-50"
                                title="Registrar Cambaceo / Visita en Calle"
                                onClick={() => handleOpenTouch(lead, "cambaceo")}
                              >
                                <MapPin className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"
                                title="Registrar WhatsApp"
                                onClick={() => handleOpenTouch(lead, "whatsapp")}
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                                title="Registrar Llamada"
                                onClick={() => handleOpenTouch(lead, "call")}
                              >
                                <Phone className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs font-medium"
                                title="Copiar datos estructurados para MELI"
                                onClick={() => copyForMeli(lead)}
                              >
                                <Copy className="h-3.5 w-3.5 mr-1" /> Copiar a MELI
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal para Registrar Toque */}
      {touchLead && (
        <Dialog open={!!touchLead} onOpenChange={() => setTouchLead(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                Registrar Toque: {touchLead.company}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Canal: <strong className="capitalize">{touchType === "cambaceo" ? "📍 Cambaceo (Visita en frío)" : touchType}</strong> • Registra el resultado del contacto.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-2">
              <div className="flex gap-1.5">
                {[
                  { key: "cambaceo" as TouchType, label: "📍 Cambaceo" },
                  { key: "whatsapp" as TouchType, label: "💬 Whats" },
                  { key: "call" as TouchType, label: "📞 Llamada" },
                  { key: "email" as TouchType, label: "✉️ Email" },
                ].map((t) => (
                  <Button
                    key={t.key}
                    type="button"
                    variant={touchType === t.key ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-7 flex-1"
                    onClick={() => setTouchType(t.key)}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
              <Textarea
                placeholder="ej. Visité el restaurante en Plaza Las Américas. Hablé con el dueño Don Ramón, le interesa terminal Point Smart para reducir comisión..."
                value={touchNote}
                onChange={(e) => setTouchNote(e.target.value)}
                rows={3}
                className="text-xs"
                autoFocus
              />

              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setTouchLead(null)}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSaveTouch}>
                  Guardar Toque
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
};

export default LeadsList;
