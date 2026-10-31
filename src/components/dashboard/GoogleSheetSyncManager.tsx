import React, { useState, useMemo } from "react";
import { useMeliCockpit } from "@/hooks/useMeliCockpit";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  Upload,
  Link2,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Layers,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { CrmLead } from "@/types/crm";
import { getIndustries } from "@/utils/industries";

export const GoogleSheetSyncManager: React.FC = () => {
  const {
    stagingLeads,
    activeLeads,
    activateNextBatch,
    activateSelectedLeads,
    markUploadedToMeli,
    setStagingBase,
    resetToMasterPool,
  } = useMeliCockpit();

  const [sheetUrl, setSheetUrl] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "in_crm">("pending");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const industries = useMemo(() => getIndustries(), []);

  // Filter Staging Leads
  const filteredStaging = useMemo(() => {
    return stagingLeads.filter((lead) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        lead.company.toLowerCase().includes(q) ||
        lead.name.toLowerCase().includes(q) ||
        (lead.phone && lead.phone.includes(q)) ||
        (lead.city && lead.city.toLowerCase().includes(q));

      const matchesCity = cityFilter === "all" || lead.city === cityFilter;
      const matchesIndustry = industryFilter === "all" || lead.industry === industryFilter;

      const isInCrm = lead.status_mi_crm === "Activo en Mi CRM";
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" && !isInCrm) ||
        (statusFilter === "in_crm" && isInCrm);

      return matchesSearch && matchesCity && matchesIndustry && matchesStatus;
    });
  }, [stagingLeads, searchTerm, cityFilter, industryFilter, statusFilter]);

  // Handle Select All in Current View
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pendingIds = filteredStaging
        .filter((l) => l.status_mi_crm !== "Activo en Mi CRM")
        .map((l) => l.id);
      setSelectedIds(pendingIds);
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Connect & Sync Google Sheet via CSV URL
  const handleSyncGoogleSheet = async () => {
    if (!sheetUrl.trim()) {
      toast.error("Por favor ingresa la URL de tu Google Sheet (publicado como CSV)");
      return;
    }

    setLoading(true);
    try {
      // Ensure it's fetching CSV format if it's a standard edit url
      let fetchUrl = sheetUrl.trim();
      if (fetchUrl.includes("/edit")) {
        fetchUrl = fetchUrl.replace(/\/edit.*$/, "/export?format=csv");
      }

      const res = await fetch(fetchUrl);
      if (!res.ok) {
        throw new Error(`Error ${res.status}: No se pudo descargar la hoja.`);
      }

      const csvText = await res.text();
      const workbook = XLSX.read(csvText, { type: "string" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const jsonRows = XLSX.utils.sheet_to_json<any>(sheet);

      if (!jsonRows || jsonRows.length === 0) {
        toast.warning("La hoja no contiene filas con datos.");
        return;
      }

      // Map rows to CrmLead format
      const importedLeads: CrmLead[] = jsonRows.map((r, idx) => {
        const id = r["ID_CRM_Lead"] || r["id"] || `GSHEET-${idx + 1}`;
        const company = r["Nombre_Cuenta"] || r["company"] || r["Nombre"] || "Comercio";
        const phone = String(r["Telefono_10_Digitos"] || r["phone"] || r["Telefono"] || "").replace(/\D/g, "");
        const city = r["Ciudad"] || r["city"] || "Cancún";
        const industry = r["Vertical_Industria"] || r["industry"] || "General";
        const statusMiCrm = r["Estatus_En_Mi_CRM"] || "En Espera / Banco";
        const statusMeli = r["Estatus_En_MELI_CRM"] || "Pendiente de Carga";

        return {
          id,
          name: company,
          company,
          contact_person: r["Contacto_Puesto"] || "Director / Dueño",
          phone,
          phone_intl: r["Telefono_Internacional"] || (phone ? `+52 ${phone}` : ""),
          whatsapp_link: r["Enlace_WhatsApp"] || (phone ? `https://wa.me/52${phone}` : ""),
          email: r["Correo_Electronico"] || "",
          website_or_ig: r["Sitio_Web_O_Instagram"] || "",
          address_full: r["Direccion_Fisica_Completa"] || "",
          street_and_number: r["Calle_Y_Numero"] || "",
          neighborhood: r["Colonia"] || "",
          postal_code: String(r["Codigo_Postal"] || ""),
          city,
          state: r["Estado"] || "Quintana Roo",
          industry,
          mcc: String(r["MCC"] || ""),
          product_opportunity: r["Producto_Oportunidad"] || "Point Smart 4G",
          tpv_monthly: Number(r["TPV_Estimado_Mensual_MXN"]) || 450000,
          quality_points: Number(r["Puntos_Calidad_Esperados"]) || 2.5,
          operational_pain: r["Dolor_Operativo_Detectado"] || "",
          opening_hook: r["Gancho_WhatsApp_Primer_Contacto"] || "",
          stage: "new",
          status_mi_crm: statusMiCrm.includes("Activo") ? "Activo en Mi CRM" : "En Espera / Banco",
          status_meli_crm: statusMeli.includes("Cargado") ? "Cargado en MELI CRM" : "Pendiente de Carga",
          fecha_carga_mi_crm: r["Fecha_Carga_Mi_CRM"] || undefined,
          fecha_carga_meli: r["Fecha_Carga_MELI"] || undefined,
          touches: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });

      setStagingBase(importedLeads);
      toast.success(`✅ Sincronizados ${importedLeads.length} prospectos desde Google Sheets.`);
    } catch (err: any) {
      toast.error(`Error al sincronizar Google Sheets: ${err.message || "Revisa permisos de la hoja"}`);
    } finally {
      setLoading(false);
    }
  };

  // Upload Local Excel / CSV File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonRows = XLSX.utils.sheet_to_json<any>(sheet);

        const importedLeads: CrmLead[] = jsonRows.map((r, idx) => {
          const id = r["ID_CRM_Lead"] || r["id"] || `FILE-${idx + 1}`;
          const company = r["Nombre_Cuenta"] || r["company"] || r["Nombre"] || "Comercio";
          const phone = String(r["Telefono_10_Digitos"] || r["phone"] || r["Telefono"] || "").replace(/\D/g, "");
          return {
            id,
            name: company,
            company,
            contact_person: r["Contacto_Puesto"] || "Director / Dueño",
            phone,
            phone_intl: r["Telefono_Internacional"] || (phone ? `+52 ${phone}` : ""),
            whatsapp_link: r["Enlace_WhatsApp"] || (phone ? `https://wa.me/52${phone}` : ""),
            email: r["Correo_Electronico"] || "",
            website_or_ig: r["Sitio_Web_O_Instagram"] || "",
            address_full: r["Direccion_Fisica_Completa"] || "",
            street_and_number: r["Calle_Y_Numero"] || "",
            neighborhood: r["Colonia"] || "",
            postal_code: String(r["Codigo_Postal"] || ""),
            city: r["Ciudad"] || "Cancún",
            state: r["Estado"] || "Quintana Roo",
            industry: r["Vertical_Industria"] || "General",
            mcc: String(r["MCC"] || ""),
            product_opportunity: r["Producto_Oportunidad"] || "Point Smart 4G",
            tpv_monthly: Number(r["TPV_Estimado_Mensual_MXN"]) || 450000,
            quality_points: Number(r["Puntos_Calidad_Esperados"]) || 2.5,
            operational_pain: r["Dolor_Operativo_Detectado"] || "",
            opening_hook: r["Gancho_WhatsApp_Primer_Contacto"] || "",
            stage: "new",
            status_mi_crm: (r["Estatus_En_Mi_CRM"] || "").includes("Activo")
              ? "Activo en Mi CRM"
              : "En Espera / Banco",
            status_meli_crm: (r["Estatus_En_MELI_CRM"] || "").includes("Cargado")
              ? "Cargado en MELI CRM"
              : "Pendiente de Carga",
            fecha_carga_mi_crm: r["Fecha_Carga_Mi_CRM"] || undefined,
            fecha_carga_meli: r["Fecha_Carga_MELI"] || undefined,
            touches: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        });

        setStagingBase(importedLeads);
        toast.success(`Archivo procesado: ${importedLeads.length} leads cargados.`);
      } catch (err: any) {
        toast.error("Error al leer el archivo Excel/CSV: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Export Synchronized Excel (Anti-duplicate proof)
  const handleExportSyncExcel = () => {
    if (stagingLeads.length === 0) {
      toast.warning("No hay datos en el banco maestro para exportar.");
      return;
    }

    const exportRows = stagingLeads.map((l) => ({
      ID_CRM_Lead: l.id,
      Nombre_Cuenta: l.company,
      Contacto_Puesto: l.contact_person,
      Telefono_10_Digitos: l.phone,
      Telefono_Internacional: l.phone_intl,
      Enlace_WhatsApp: l.whatsapp_link,
      Correo_Electronico: l.email,
      Sitio_Web_O_Instagram: l.website_or_ig,
      Direccion_Fisica_Completa: l.address_full,
      Calle_Y_Numero: l.street_and_number,
      Colonia: l.neighborhood,
      Codigo_Postal: l.postal_code,
      Ciudad: l.city,
      Estado: l.state,
      Vertical_Industria: l.industry,
      Producto_Oportunidad: l.product_opportunity,
      TPV_Estimado_Mensual_MXN: l.tpv_monthly,
      Puntos_Calidad_Esperados: l.quality_points,
      Dolor_Operativo_Detectado: l.operational_pain,
      Gancho_WhatsApp_Primer_Contacto: l.opening_hook,
      Estatus_En_Mi_CRM: l.status_mi_crm,
      Estatus_En_MELI_CRM: l.status_meli_crm,
      Fecha_Carga_Mi_CRM: l.fecha_carga_mi_crm || "",
      Fecha_Carga_MELI: l.fecha_carga_meli || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Base_Maestra_Sincronizada");
    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `BASE_MAESTRA_MERCADOPAGO_SINCRONIZADA_${dateStr}.xlsx`);
    toast.success("📥 Archivo Excel descargado con estatus anti-duplicados.");
  };

  return (
    <Card className="border-2 border-primary/20 shadow-md">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Conexión Google Sheets & Selector de Leads
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Controla de forma manual o en lotes de 10 qué prospectos pasar a tu CRM activo, verificando estatus para jamás duplicar en Mercado Libre.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportSyncExcel}
              className="text-xs h-9"
            >
              <Download className="h-4 w-4 mr-1.5 text-primary" />
              Descargar Hoja Actualizada
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToMasterPool}
              className="text-xs h-9 text-muted-foreground hover:text-foreground"
              title="Restablecer los 644 leads de Quintana Roo"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Restablecer Base Q.Roo
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 1. Barra de Conexión: URL de Google Sheets o Carga de Archivo */}
        <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5 text-primary" />
              Opción A: Conectar Enlace de Google Sheets (En Vivo)
            </h4>
            <span className="text-[11px] text-muted-foreground">
              Total en Banco: <strong>{stagingLeads.length} leads</strong> • Disponibles:{" "}
              <strong className="text-emerald-600">
                {stagingLeads.filter((l) => l.status_mi_crm !== "Activo en Mi CRM").length}
              </strong>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <Input
              placeholder="Pega aquí el enlace de tu Google Sheet (ej: https://docs.google.com/spreadsheets/d/.../edit)"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className="text-xs h-9 flex-1"
            />
            <Button
              size="sm"
              onClick={handleSyncGoogleSheet}
              disabled={loading || !sheetUrl.trim()}
              className="text-xs h-9 w-full sm:w-auto"
            >
              {loading ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5 mr-1.5" />}
              Sincronizar Google Sheet
            </Button>
          </div>

          <div className="pt-1 flex flex-wrap items-center justify-between text-[11px] text-muted-foreground gap-2">
            <span>
              💡 <em>¿Cómo conectar tu Google Sheet?</em> En tu hoja de cálculo ve a <strong>Archivo → Compartir → Publicar en la web → Selecciona formato CSV</strong> y pega el link.
            </span>
            <label className="cursor-pointer text-primary hover:underline font-medium inline-flex items-center gap-1">
              <Upload className="h-3 w-3" /> O subir archivo Excel (.xlsx / .csv)
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* 2. Filtros y Búsqueda */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por comercio, teléfono o zona..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Ciudad */}
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-[130px] text-xs h-9">
                <SelectValue placeholder="Ciudad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Ciudades</SelectItem>
                <SelectItem value="Cancún">Cancún</SelectItem>
                <SelectItem value="Playa del Carmen">Playa del Carmen</SelectItem>
                <SelectItem value="Tulum">Tulum</SelectItem>
                <SelectItem value="Cozumel">Cozumel</SelectItem>
                <SelectItem value="Chetumal">Chetumal</SelectItem>
              </SelectContent>
            </Select>

            {/* Industria */}
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-[160px] text-xs h-9">
                <SelectValue placeholder="Industria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Industrias</SelectItem>
                {industries.map((ind) => (
                  <SelectItem key={ind} value={ind}>
                    {ind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Estatus */}
            <Select
              value={statusFilter}
              onValueChange={(val: "all" | "pending" | "in_crm") => setStatusFilter(val)}
            >
              <SelectTrigger className="w-[150px] text-xs h-9">
                <SelectValue placeholder="Estatus Mi CRM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Solo Pendientes</SelectItem>
                <SelectItem value="in_crm">Ya en Mi CRM Activo</SelectItem>
                <SelectItem value="all">Todos los Registros</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 3. Barra de Acciones de Activación */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="text-xs">
            Seleccionados: <strong>{selectedIds.length}</strong> de{" "}
            <strong>{filteredStaging.length}</strong> prospectos mostrados
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant="outline"
              disabled={selectedIds.length === 0}
              onClick={() => {
                activateSelectedLeads(selectedIds);
                setSelectedIds([]);
              }}
              className="text-xs h-8 flex-1 sm:flex-none border-primary text-primary hover:bg-primary/10"
            >
              <Layers className="h-3.5 w-3.5 mr-1.5" />
              Enviar Seleccionados ({selectedIds.length}) a Mi CRM
            </Button>

            <Button
              size="sm"
              onClick={() => activateNextBatch(10)}
              className="text-xs h-8 flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90"
            >
              ⚡ Enviar Siguiente Lote de 10
            </Button>
          </div>
        </div>

        {/* 4. Tabla de Leads en Espera (Staging Queue) */}
        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[420px] overflow-y-auto">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        filteredStaging.length > 0 &&
                        selectedIds.length ===
                          filteredStaging.filter((l) => l.status_mi_crm !== "Activo en Mi CRM").length
                      }
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    />
                  </TableHead>
                  <TableHead className="text-xs font-semibold">Comercio / Cuenta</TableHead>
                  <TableHead className="text-xs font-semibold">Vertical / Industria</TableHead>
                  <TableHead className="text-xs font-semibold">Ciudad</TableHead>
                  <TableHead className="text-xs font-semibold">Teléfono / WhatsApp</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Estatus Mi CRM</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Estatus MELI CRM</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaging.map((lead) => {
                  const isInMiCrm = lead.status_mi_crm === "Activo en Mi CRM";
                  const isUploadedMeli = lead.status_meli_crm === "Cargado en MELI CRM";
                  const isChecked = selectedIds.includes(lead.id);

                  return (
                    <TableRow key={lead.id} className={isInMiCrm ? "bg-muted/10 opacity-75" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={isChecked}
                          disabled={isInMiCrm}
                          onCheckedChange={() => toggleSelectOne(lead.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-xs">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{lead.company}</span>
                          <span className="text-[11px] text-muted-foreground">{lead.contact_person}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {lead.industry}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{lead.city}</TableCell>
                      <TableCell className="text-xs">
                        {lead.phone ? (
                          <a
                            href={lead.whatsapp_link || `https://wa.me/52${lead.phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:underline flex items-center gap-1"
                          >
                            <MessageSquare className="h-3 w-3" />
                            {lead.phone}
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Sin teléfono</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {isInMiCrm ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                            ✓ En Mi CRM Activo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            En Espera / Banco
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {isUploadedMeli ? (
                          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]">
                            ✓ En CRM MELI
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/20">
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!isInMiCrm ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => activateSelectedLeads([lead.id])}
                              className="h-7 text-[11px] px-2 text-primary border-primary/30 hover:bg-primary/10"
                            >
                              + Pasar a Mi CRM
                            </Button>
                          ) : !isUploadedMeli ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markUploadedToMeli(lead.id)}
                              className="h-7 text-[11px] px-2 text-blue-600 hover:bg-blue-50"
                              title="Marcar como ya registrado en el CRM oficial de Mercado Pago"
                            >
                              ✓ Ya en MELI
                            </Button>
                          ) : (
                            <span className="text-[11px] text-muted-foreground font-medium">Sincronizado</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filteredStaging.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-28 text-center text-xs text-muted-foreground">
                      No se encontraron prospectos con los filtros actuales.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
