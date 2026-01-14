
import { useState, useRef } from "react";
import { Lead, Channel, LeadStatus } from "@/utils/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Download, FileText, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CSVImportExportProps {
  leads: Lead[];
  onImport: (leads: Array<Omit<Lead, "id" | "user_id" | "created_at" | "updated_at">>) => Promise<void>;
}

export const CSVImportExport = ({ leads, onImport }: CSVImportExportProps) => {
  const [importing, setImporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportToCSV = () => {
    if (leads.length === 0) {
      toast.error("No hay leads para exportar");
      return;
    }

    const headers = [
      "Nombre",
      "Email",
      "Teléfono",
      "Empresa",
      "Canal",
      "Estado",
      "Fecha Creación",
      "Próximo Seguimiento",
      "Valor Venta",
    ];

    const rows = leads.map((lead) => [
      lead.name,
      lead.email || "",
      lead.phone || "",
      lead.company || "",
      lead.channel,
      lead.status,
      lead.created_at,
      lead.next_followup_at || "",
      lead.sale_value?.toString() || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`${leads.length} leads exportados`);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());
      
      if (lines.length < 2) {
        throw new Error("El archivo está vacío o no tiene datos");
      }

      const headers = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/"/g, ""));
      
      const nameIndex = headers.findIndex((h) => h.includes("nombre") || h === "name");
      const emailIndex = headers.findIndex((h) => h.includes("email") || h.includes("correo"));
      const phoneIndex = headers.findIndex((h) => h.includes("teléfono") || h.includes("telefono") || h === "phone");
      const companyIndex = headers.findIndex((h) => h.includes("empresa") || h === "company");
      const channelIndex = headers.findIndex((h) => h.includes("canal") || h === "channel");
      const statusIndex = headers.findIndex((h) => h.includes("estado") || h === "status");

      if (nameIndex === -1) {
        throw new Error("El archivo debe tener una columna 'Nombre' o 'Name'");
      }

      const parseValue = (value: string) => value?.replace(/^"|"$/g, "").trim() || "";

      const validChannels: Channel[] = ["linkedin", "phone", "email"];
      const validStatuses: LeadStatus[] = ["new", "contacted", "negotiation", "won", "lost"];

      const leadsToImport: Array<Omit<Lead, "id" | "user_id" | "created_at" | "updated_at">> = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",");
        const name = parseValue(values[nameIndex]);

        if (!name) continue;

        let channel: Channel = "email";
        if (channelIndex !== -1) {
          const parsedChannel = parseValue(values[channelIndex]).toLowerCase();
          if (validChannels.includes(parsedChannel as Channel)) {
            channel = parsedChannel as Channel;
          }
        }

        let status: LeadStatus = "new";
        if (statusIndex !== -1) {
          const parsedStatus = parseValue(values[statusIndex]).toLowerCase();
          if (validStatuses.includes(parsedStatus as LeadStatus)) {
            status = parsedStatus as LeadStatus;
          }
        }

        leadsToImport.push({
          name,
          email: emailIndex !== -1 ? parseValue(values[emailIndex]) || undefined : undefined,
          phone: phoneIndex !== -1 ? parseValue(values[phoneIndex]) || undefined : undefined,
          company: companyIndex !== -1 ? parseValue(values[companyIndex]) || undefined : undefined,
          channel,
          status,
        });
      }

      if (leadsToImport.length === 0) {
        throw new Error("No se encontraron leads válidos en el archivo");
      }

      await onImport(leadsToImport);
      setImportDialogOpen(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al importar");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `Nombre,Email,Teléfono,Empresa,Canal,Estado
"Juan Pérez","juan@email.com","+1234567890","Empresa ABC","linkedin","new"
"María García","maria@email.com","+0987654321","Empresa XYZ","phone","contacted"
"Carlos López","carlos@email.com","","","email","negotiation"`;

    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_leads.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Plantilla descargada");
  };

  return (
    <div className="flex gap-2">
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar CSV
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar leads desde CSV</DialogTitle>
            <DialogDescription>
              Sube un archivo CSV con tus leads. El archivo debe tener al menos una columna "Nombre".
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8">
              <FileText className="h-10 w-10 text-muted-foreground mb-4" />
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button variant="outline" asChild disabled={importing}>
                  <span>
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Seleccionar archivo
                      </>
                    )}
                  </span>
                </Button>
              </label>
              <p className="text-sm text-muted-foreground mt-2">CSV con columnas: Nombre, Email, Teléfono, Empresa, Canal, Estado</p>
            </div>

            <div className="text-center">
              <Button variant="link" onClick={downloadTemplate} className="text-sm">
                <Download className="h-4 w-4 mr-1" />
                Descargar plantilla de ejemplo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button variant="outline" size="sm" onClick={exportToCSV}>
        <Download className="h-4 w-4 mr-2" />
        Exportar CSV
      </Button>
    </div>
  );
};
