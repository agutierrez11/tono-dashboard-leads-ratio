
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { mockLeads } from "@/utils/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Search, Filter, Linkedin, Phone, Mail, Users, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Channel } from "@/utils/types";
import { toast } from "sonner";

const LeadsList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");

  const filteredLeads = useMemo(() => {
    return mockLeads.filter(lead => {
      const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesChannel = channelFilter === "all" || lead.channel === channelFilter;
      return matchesSearch && matchesChannel;
    });
  }, [searchTerm, channelFilter]);

  const getChannelIcon = (channel: Channel) => {
    switch (channel) {
      case "linkedin":
        return <Linkedin className="h-4 w-4 text-linkedin" />;
      case "phone":
        return <Phone className="h-4 w-4 text-phone" />;
      case "email":
        return <Mail className="h-4 w-4 text-email" />;
    }
  };

  const getChannelBadge = (channel: Channel) => {
    const variants: Record<Channel, string> = {
      linkedin: "bg-linkedin/10 text-linkedin border-linkedin/20",
      phone: "bg-phone/10 text-phone border-phone/20",
      email: "bg-email/10 text-email border-email/20",
    };
    return variants[channel];
  };

  const generateCSV = () => {
    const headers = ["Nombre", "Empresa", "Canal", "Fecha", "Estado"];
    const rows = filteredLeads.map(lead => [
      lead.name,
      lead.company || "",
      lead.channel,
      lead.date.toLocaleDateString(),
      lead.status || "nuevo"
    ]);
    return [headers, ...rows].map(row => row.join(",")).join("\n");
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const csv = generateCSV();
    downloadFile(csv, "leads.csv", "text/csv");
    toast.success("Archivo CSV descargado");
  };

  const handleDownloadExcel = () => {
    const csv = generateCSV();
    downloadFile(csv, "leads.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    toast.success("Archivo Excel descargado");
  };

  const handleDownloadPDF = () => {
    toast.success("Generando PDF...");
    setTimeout(() => {
      toast.success("PDF descargado");
    }, 1000);
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
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Users className="h-8 w-8" />
                Lista de Leads
              </h1>
              <p className="text-muted-foreground mt-1">
                {filteredLeads.length} leads encontrados
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem onClick={handleDownloadPDF}>
                📄 Descargar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadExcel}>
                📊 Descargar Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadCSV}>
                📋 Descargar CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los canales</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="phone">Teléfono</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No se encontraron leads
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead) => (
                      <TableRow key={lead.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell>{lead.company || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getChannelBadge(lead.channel)}>
                            <span className="flex items-center gap-1">
                              {getChannelIcon(lead.channel)}
                              {lead.channel === "linkedin" ? "LinkedIn" : 
                               lead.channel === "phone" ? "Teléfono" : "Email"}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>{lead.date.toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {lead.status || "nuevo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default LeadsList;
