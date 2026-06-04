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
import { useDataImportExport } from "@/hooks/useDataImportExport";

interface DataActionsProps {
  onImportData?: (data: any[]) => void;
}

export const DataActions = ({ onImportData }: DataActionsProps) => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const {
    handleClearData,
    handleDownloadCSV,
    handleDownloadExcel,
    handleDownloadPDF,
    handleDownloadTemplate,
    handleFileUpload,
  } = useDataImportExport({
    onImportData,
    onCloseUploadDialog: () => setIsUploadDialogOpen(false),
  });

  return (
    <div className="flex flex-wrap gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm" className="hover:bg-destructive/90 transition-colors">
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
            <AlertDialogAction onClick={handleClearData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Descargar Reporte
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-popover border shadow-xl rounded-lg">
          <DropdownMenuItem onClick={handleDownloadPDF} className="cursor-pointer hover:bg-accent transition-colors">
            <FileText className="h-4 w-4 mr-2 text-red-500" />
            PDF (Imprimir)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadExcel} className="cursor-pointer hover:bg-accent transition-colors">
            <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-500" />
            Excel (.xlsx)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadCSV} className="cursor-pointer hover:bg-accent transition-colors">
            <FileDown className="h-4 w-4 mr-2 text-blue-500" />
            CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="transition-colors">
            <Upload className="h-4 w-4 mr-2" />
            Subir Datos
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md bg-card border shadow-2xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Importar Leads</DialogTitle>
            <DialogDescription>
              Sube un archivo Excel (.xlsx) o CSV con tus leads. Usa la plantilla para el formato correcto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button variant="outline" onClick={handleDownloadTemplate} className="w-full hover:bg-accent transition-colors">
              <FileDown className="h-4 w-4 mr-2" />
              Descargar Plantilla CSV
            </Button>
            <div className="border-2 border-dashed border-primary/20 hover:border-primary/40 rounded-xl p-8 text-center transition-all duration-300 bg-muted/20">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <FileSpreadsheet className="h-10 w-10 mb-2 text-primary animate-bounce" />
                <p className="text-sm font-medium text-foreground">
                  Haz clic para seleccionar un archivo
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Excel (.xlsx) o CSV
                </p>
              </label>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
