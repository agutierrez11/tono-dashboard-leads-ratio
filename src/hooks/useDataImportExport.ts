import { useState } from "react";
import { toast } from "sonner";
import { useLeads, useLeadStats, useDeleteAllLeads } from "@/hooks/useLeads";
import * as XLSX from "xlsx";

interface UseDataImportExportProps {
  onImportData?: (data: any[]) => void;
  onCloseUploadDialog?: () => void;
}

export const useDataImportExport = ({ onImportData, onCloseUploadDialog }: UseDataImportExportProps = {}) => {
  const { data: leads = [] } = useLeads();
  const { stats } = useLeadStats();
  const deleteAllLeads = useDeleteAllLeads();

  const handleClearData = async () => {
    try {
      await deleteAllLeads.mutateAsync();
    } catch (error) {
      // Error handled in hook
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
    
    return [headers, ...rows].map(row => row.join(",")).join("\n");
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
      "# Estado: new | contacted | qualified | proposal | won | lost",
      "# IMPORTANTE: No uses comas dentro de los valores",
      ""
    ];
    
    return [...instructions, headers.join(","), exampleRow.join(",")].join("\n");
  };

  const handleDownloadTemplate = () => {
    const template = "\uFEFF" + generateTemplate();
    downloadFile(template, "plantilla_leads.csv", "text/csv;charset=utf-8");
    toast.success("Plantilla descargada");
  };

  const detectDelimiter = (text: string): string => {
    const firstDataLine = text.split("\n").find(line => !line.startsWith("#") && line.trim());
    if (!firstDataLine) return ",";
    
    const commaCount = (firstDataLine.match(/,/g) || []).length;
    const semicolonCount = (firstDataLine.match(/;/g) || []).length;
    
    return semicolonCount > commaCount ? ";" : ",";
  };

  const parseCSVLine = (line: string, delimiter: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    
    result.push(current.trim().replace(/^"|"$/g, ""));
    return result;
  };

  const normalizeHeader = (header: string): string => {
    return header
      .replace(/^\uFEFF/, "")
      .trim()
      .replace(/^"|"$/g, "")
      .toLowerCase();
  };

  const getIndexByHeader = (headers: string[], candidates: string[]) => {
    for (const c of candidates) {
      const idx = headers.indexOf(c);
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const normalizeChannel = (value: string): string => {
    const normalized = value.toLowerCase().trim();
    if (normalized.includes("linkedin") || normalized === "li" || normalized.includes("salesnavigator") || normalized.includes("navigator")) return "linkedin";
    if (normalized.includes("phone") || normalized.includes("telefono") || normalized.includes("tel") || normalized.includes("llamada")) return "phone";
    if (normalized.includes("email") || normalized.includes("correo") || normalized.includes("mail")) return "email";
    return "email";
  };

  const normalizeStatus = (value: string): string => {
    const normalized = value.toLowerCase().trim();
    if (normalized === "new" || normalized === "nuevo") return "new";
    if (normalized === "contacted" || normalized === "contactado") return "contacted";
    if (normalized === "qualified" || normalized === "calificado") return "qualified";
    if (normalized === "proposal" || normalized === "propuesta") return "proposal";
    if (normalized === "won" || normalized === "ganado" || normalized === "closed" || normalized === "cerrado") return "won";
    if (normalized === "lost" || normalized === "perdido") return "lost";
    return "new";
  };

  const processRowsData = (rows: string[][]): Record<string, any>[] => {
    if (rows.length < 2) return [];

    const headers = rows[0].map(normalizeHeader);
    const idxName = getIndexByHeader(headers, ["nombre", "name"]);
    const idxCompany = getIndexByHeader(headers, ["empresa", "company"]);
    const idxChannel = getIndexByHeader(headers, ["canal", "channel"]);
    const idxStatus = getIndexByHeader(headers, ["estado", "status"]);
    const idxEmail = getIndexByHeader(headers, ["email", "correo"]);
    const idxPhone = getIndexByHeader(headers, ["telefono", "teléfono", "phone", "tel"]);

    const hasRecognizedHeaders = idxName !== -1 || idxCompany !== -1 || idxChannel !== -1 || idxStatus !== -1;

    return rows.slice(1).map((values, index) => {
      const lead: Record<string, any> = { id: `imported-${index + 1}` };

      if (hasRecognizedHeaders) {
        if (idxName >= 0) lead.name = values[idxName] || "";
        if (idxCompany >= 0) lead.company = values[idxCompany] || "";
        if (idxChannel >= 0) lead.channel = normalizeChannel(values[idxChannel] || "");
        if (idxStatus >= 0) lead.status = normalizeStatus(values[idxStatus] || "");
        if (idxEmail >= 0) lead.email = values[idxEmail] || "";
        if (idxPhone >= 0) lead.phone = values[idxPhone] || "";
      } else {
        lead.name = values[0] || "";
        lead.company = values[1] || "";
        lead.channel = normalizeChannel(values[2] || "");
        lead.status = normalizeStatus(values[3] || "");
        lead.email = values[4] || "";
        lead.phone = values[5] || "";
      }

      if (!lead.channel) lead.channel = "email";
      if (!lead.status) lead.status = "new";
      if (!lead.name || !String(lead.name).trim()) lead.name = "Sin nombre";

      return lead;
    });
  };

  const processXLSX = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error("No sheet name found");
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) throw new Error("No sheet found");
        
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { 
          header: 1,
          defval: "",
          range: "A:F"
        });

        const validRows = rows.filter(row => 
          row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== "" && !String(cell).startsWith("#"))
        );

        if (validRows.length < 2) {
          toast.error("El archivo no contiene datos válidos");
          return;
        }

        const parsedLeads = processRowsData(validRows);

        if (parsedLeads.length === 0) {
          toast.error("No se encontraron leads válidos en el archivo");
          return;
        }

        toast.success(`${parsedLeads.length} leads listos para importar`);
        onImportData?.(parsedLeads);
        onCloseUploadDialog?.();
      } catch (error) {
        console.error("Error al procesar archivo XLSX:", error);
        toast.error("Error al procesar el archivo Excel");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => !line.startsWith("#") && line.trim() !== "");
        
        if (lines.length < 2) {
          toast.error("El archivo no contiene datos válidos");
          return;
        }

        const delimiter = detectDelimiter(text);
        const rows = lines.map(line => parseCSVLine(line, delimiter));
        const parsedLeads = processRowsData(rows);
        
        if (parsedLeads.length === 0) {
          toast.error("No se encontraron leads válidos en el archivo");
          return;
        }

        toast.success(`${parsedLeads.length} leads listos para importar`);
        onImportData?.(parsedLeads);
        onCloseUploadDialog?.();
      } catch (error) {
        console.error("Error al procesar archivo CSV:", error);
        toast.error("Error al procesar el archivo");
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      processXLSX(file);
    } else {
      processCSV(file);
    }
  };

  return {
    leads,
    handleClearData,
    handleDownloadCSV,
    handleDownloadExcel,
    handleDownloadPDF,
    handleDownloadTemplate,
    handleFileUpload,
    detectDelimiter,
    parseCSVLine,
    normalizeHeader,
    normalizeChannel,
    normalizeStatus,
    processRowsData
  };
};
