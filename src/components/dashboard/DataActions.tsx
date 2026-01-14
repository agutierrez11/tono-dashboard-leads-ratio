import { useState } from "react";
import { Trash2, Download, Upload, FileSpreadsheet, FileText, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLeads, useLeadStats, useDeleteAllLeads } from "@/hooks/useLeads";

interface DataActionsProps {
  onImportData?: (data: any[]) => void;
}

export const DataActions = ({ onImportData }: DataActionsProps) => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const { data: leads = [] } = useLeads();
  const { stats } = useLeadStats();
  const deleteAllLeads = useDeleteAllLeads();

  const handleClearData = async () => {
    try {
      await deleteAllLeads.mutateAsync();
    } catch (error) {
      // Error already handled in the hook
    }
  };

  const generateCSV = () => {
    const headers = ["ID", "Nombre", "Empresa", "Canal", "Estado", "Fecha", "Fecha Cierre"];
    const rows = leads.map(lead => [
      lead.id,
      lead.name,
      lead.company || "",
      lead.channel,
      lead.status,
      new Date(lead.created_at).toISOString().split('T')[0],
      lead.closed_at ? new Date(lead.closed_at).toISOString().split('T')[0] : ""
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    return csvContent;
  };

  const generateExcelCSV = () => {
    const bom = "\uFEFF";
    return bom + generateCSV();
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const csv = generateCSV();
    downloadFile(csv, "leads_report.csv", "text/csv;charset=utf-8");
    toast.success("Reporte CSV descargado");
  };

  const handleDownloadExcel = () => {
    const csv = generateExcelCSV();
    downloadFile(csv, "leads_report.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    toast.success("Reporte Excel descargado");
  };

  const handleDownloadPDF = () => {
    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte de Leads</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f4f4f4; }
          .metrics { margin-top: 30px; }
          .metric-card { background: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 8px; }
        </style>
      </head>
      <body>
        <h1>Reporte de Leads</h1>
        <p>Generado: ${new Date().toLocaleDateString('es-ES')}</p>
        
        <div class="metrics">
          <h2>Métricas por Canal</h2>
          ${stats.conversionRates.map(cr => `
            <div class="metric-card">
              <strong>${cr.channel.toUpperCase()}</strong>
              <p>Tasa de Conversión: ${cr.rate}%</p>
              <p>Leads: ${cr.leads} | Cerrados: ${cr.closed}</p>
            </div>
          `).join('')}
        </div>

        <div class="metrics">
          <h2>Ciclo de Venta por Canal</h2>
          ${stats.salesCycleTimes.map(sc => `
            <div class="metric-card">
              <strong>${sc.channel.toUpperCase()}</strong>
              <p>Tiempo Promedio: ${sc.avgDays} días</p>
              <p>Cantidad: ${sc.count} leads</p>
            </div>
          `).join('')}
        </div>

        <h2>Lista de Leads</h2>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Empresa</th>
              <th>Canal</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            ${leads.map(lead => `
              <tr>
                <td>${lead.name}</td>
                <td>${lead.company || ""}</td>
                <td>${lead.channel}</td>
                <td>${lead.status}</td>
                <td>${new Date(lead.created_at).toLocaleDateString('es-ES')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    const blob = new Blob([reportHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    toast.success("Abriendo reporte para imprimir/guardar como PDF");
  };

  const generateTemplate = () => {
    const headers = ["nombre", "empresa", "canal", "estado", "email", "telefono"];
    const exampleRow = ["Juan Pérez", "Empresa ABC", "linkedin", "new", "juan@email.com", "5551234567"];
    const instructions = [
      "# INSTRUCCIONES DE USO",
      "# Canal: linkedin | phone | email",
      "# Estado: new | contacted | qualified | proposal | closed | lost",
      ""
    ];
    
    const csvContent = [...instructions, headers.join(","), exampleRow.join(",")].join("\n");
    return csvContent;
  };

  const handleDownloadTemplate = () => {
    const template = "\uFEFF" + generateTemplate();
    downloadFile(template, "plantilla_leads.csv", "text/csv;charset=utf-8");
    toast.success("Plantilla descargada");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter(line => !line.startsWith("#") && line.trim());
        
        if (lines.length < 2) {
          toast.error("El archivo no contiene datos válidos");
          return;
        }

        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
        const data = lines.slice(1).map((line, index) => {
          const values = line.split(",").map(v => v.trim());
          const lead: Record<string, any> = { id: `imported-${index + 1}` };
          
          headers.forEach((header, i) => {
            if (header === "nombre") lead.name = values[i];
            else if (header === "empresa") lead.company = values[i];
            else if (header === "canal") lead.channel = values[i];
            else if (header === "estado") lead.status = values[i];
            else if (header === "email") lead.email = values[i];
            else if (header === "telefono") lead.phone = values[i];
          });
          
          return lead;
        });

        onImportData?.(data);
        setIsUploadDialogOpen(false);
      } catch (error) {
        toast.error("Error al procesar el archivo");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Borrar Datos
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará todos los datos de leads. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearData} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Descargar Reporte
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-popover border shadow-lg">
          <DropdownMenuItem onClick={handleDownloadPDF} className="cursor-pointer">
            <FileText className="h-4 w-4 mr-2" />
            PDF (Imprimir)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadExcel} className="cursor-pointer">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel (.xlsx)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadCSV} className="cursor-pointer">
            <FileDown className="h-4 w-4 mr-2" />
            CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Subir Datos
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Leads</DialogTitle>
            <DialogDescription>
              Sube un archivo CSV con tus leads. Usa la plantilla para el formato correcto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button variant="outline" onClick={handleDownloadTemplate} className="w-full">
              <FileDown className="h-4 w-4 mr-2" />
              Descargar Plantilla
            </Button>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Haz clic para seleccionar un archivo CSV
                </p>
              </label>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
