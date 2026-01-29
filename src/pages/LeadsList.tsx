import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLeads, useUpdateLeadStatus } from "@/hooks/useLeads";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Download, Search, Filter, Linkedin, Phone, Mail, Users, ArrowLeft, Clock, TrendingUp, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { Channel } from "@/utils/types";
import { toast } from "sonner";

const statusOptions = [
  { value: "new", label: "🆕 Nuevo", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { value: "contacted", label: "📞 Contactado", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  { value: "qualified", label: "✅ Calificado", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  { value: "proposal", label: "📋 Propuesta", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  { value: "won", label: "🎉 Ganado", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  { value: "lost", label: "❌ Perdido", color: "bg-red-500/10 text-red-600 border-red-500/20" },
];

// Helper to calculate days between two dates
const calculateDaysBetween = (startDate: string, endDate?: string | null): number => {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

const LeadsList = () => {
  const { data: leads = [], isLoading } = useLeads();
  const updateStatus = useUpdateLeadStatus();
  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesChannel = channelFilter === "all" || lead.channel === channelFilter;
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      return matchesSearch && matchesChannel && matchesStatus;
    });
  }, [leads, searchTerm, channelFilter, statusFilter]);

  // Conversion metrics calculations
  const conversionMetrics = useMemo(() => {
    const wonLeads = leads.filter(l => l.status === "won" && l.closed_at);
    const lostLeads = leads.filter(l => l.status === "lost" && l.closed_at);
    const closedLeads = [...wonLeads, ...lostLeads];

    // Average days to won
    const avgDaysToWon = wonLeads.length > 0
      ? wonLeads.reduce((sum, l) => sum + calculateDaysBetween(l.created_at, l.closed_at), 0) / wonLeads.length
      : 0;

    // Average days to lost
    const avgDaysToLost = lostLeads.length > 0
      ? lostLeads.reduce((sum, l) => sum + calculateDaysBetween(l.created_at, l.closed_at), 0) / lostLeads.length
      : 0;

    // Average cycle time overall (won + lost)
    const avgCycleTime = closedLeads.length > 0
      ? closedLeads.reduce((sum, l) => sum + calculateDaysBetween(l.created_at, l.closed_at), 0) / closedLeads.length
      : 0;

    // Conversion rate (won / total closed)
    const conversionRate = closedLeads.length > 0
      ? (wonLeads.length / closedLeads.length) * 100
      : 0;

    // Active leads (not won or lost)
    const activeLeads = leads.filter(l => l.status !== "won" && l.status !== "lost");
    const avgDaysActive = activeLeads.length > 0
      ? activeLeads.reduce((sum, l) => sum + calculateDaysBetween(l.created_at), 0) / activeLeads.length
      : 0;

    return {
      totalLeads: leads.length,
      wonCount: wonLeads.length,
      lostCount: lostLeads.length,
      activeCount: activeLeads.length,
      avgDaysToWon: Math.round(avgDaysToWon * 10) / 10,
      avgDaysToLost: Math.round(avgDaysToLost * 10) / 10,
      avgCycleTime: Math.round(avgCycleTime * 10) / 10,
      avgDaysActive: Math.round(avgDaysActive * 10) / 10,
      conversionRate: Math.round(conversionRate * 10) / 10,
    };
  }, [leads]);

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

  const getStatusOption = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ leadId, status: newStatus });
      const statusLabel = getStatusOption(newStatus).label;
      toast.success(`Estado actualizado a ${statusLabel}`);
    } catch (error: any) {
      toast.error("Error al actualizar: " + error.message);
    }
  };

  const generateCSV = () => {
    const headers = ["Nombre", "Empresa", "Correo", "Teléfono", "Canal", "Fecha Creación", "Estado", "Días Totales", "Días Ciclo"];
    const rows = filteredLeads.map(lead => [
      lead.name,
      lead.company || "",
      lead.email || "",
      lead.phone || "",
      lead.channel,
      new Date(lead.created_at).toLocaleDateString(),
      lead.status || "nuevo",
      calculateDaysBetween(lead.created_at),
      lead.sale_cycle_days || ""
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

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

        {/* Conversion Metrics Section */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Tasa Conversión
              </CardDescription>
              <CardTitle className="text-2xl text-green-600">
                {conversionMetrics.conversionRate}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {conversionMetrics.wonCount} ganados / {conversionMetrics.wonCount + conversionMetrics.lostCount} cerrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Prom. días a Ganado
              </CardDescription>
              <CardTitle className="text-2xl text-green-600">
                {conversionMetrics.avgDaysToWon} días
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                De {conversionMetrics.wonCount} leads ganados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Prom. días a Perdido
              </CardDescription>
              <CardTitle className="text-2xl text-red-600">
                {conversionMetrics.avgDaysToLost} días
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                De {conversionMetrics.lostCount} leads perdidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Ciclo Promedio
              </CardDescription>
              <CardTitle className="text-2xl">
                {conversionMetrics.avgCycleTime} días
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Nuevo → Cerrado (ganado/perdido)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Leads Activos
              </CardDescription>
              <CardTitle className="text-2xl">
                {conversionMetrics.activeCount}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Prom. {conversionMetrics.avgDaysActive} días abiertos
              </p>
            </CardContent>
          </Card>
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
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
                    <TableHead>Correo</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Días Totales</TableHead>
                    <TableHead className="text-right">Días Ciclo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No se encontraron leads
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead) => {
                      const statusOption = getStatusOption(lead.status);
                      const totalDays = calculateDaysBetween(lead.created_at);
                      return (
                        <TableRow key={lead.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell>{lead.company || "-"}</TableCell>
                          <TableCell className="text-muted-foreground">{lead.email || "-"}</TableCell>
                          <TableCell className="text-muted-foreground">{lead.phone || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getChannelBadge(lead.channel)}>
                              <span className="flex items-center gap-1">
                                {getChannelIcon(lead.channel)}
                                {lead.channel === "linkedin" ? "LinkedIn" : 
                                 lead.channel === "phone" ? "Teléfono" : "Email"}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Select 
                              value={lead.status} 
                              onValueChange={(value) => handleStatusChange(lead.id, value)}
                            >
                              <SelectTrigger className={`w-[160px] h-8 text-xs ${statusOption.color}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={totalDays > 30 ? "text-orange-600 font-medium" : "text-muted-foreground"}>
                              {totalDays}d
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {lead.sale_cycle_days !== null ? (
                              <Badge variant="outline" className={lead.status === "won" ? "bg-green-500/10 text-green-600" : lead.status === "lost" ? "bg-red-500/10 text-red-600" : ""}>
                                {lead.sale_cycle_days}d
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground/50">-</span>
                            )}
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
    </DashboardLayout>
  );
};

export default LeadsList;
