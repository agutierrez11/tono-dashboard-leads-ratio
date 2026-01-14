
import { useState } from "react";
import { Lead, LeadFilters, Channel, LeadStatus } from "@/utils/types";
import { Input } from "@/components/ui/input";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Linkedin, Phone, Mail, Search, Filter, Calendar, Building, Clock, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { es } from "date-fns/locale";

interface LeadsListProps {
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
  onDeleteLead?: (lead: Lead) => void;
  filters: LeadFilters;
  onFiltersChange: (filters: LeadFilters) => void;
}

const channelIcons = {
  linkedin: Linkedin,
  phone: Phone,
  email: Mail,
};

const channelColors = {
  linkedin: 'text-linkedin bg-linkedin/10',
  phone: 'text-phone bg-phone/10',
  email: 'text-email bg-email/10',
};

const statusLabels: Record<LeadStatus, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  negotiation: 'Negociación',
  won: 'Ganado',
  lost: 'Perdido',
};

const statusColors: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  negotiation: 'bg-purple-100 text-purple-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};

export const LeadsList = ({ leads, onLeadClick, onDeleteLead, filters, onFiltersChange }: LeadsListProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const getFollowupIndicator = (lead: Lead) => {
    if (!lead.next_followup_at) return null;
    
    const followupDate = new Date(lead.next_followup_at);
    
    if (isPast(followupDate) && !isToday(followupDate)) {
      return <Badge variant="destructive" className="text-xs">Atrasado</Badge>;
    }
    if (isToday(followupDate)) {
      return <Badge className="text-xs bg-orange-500">Hoy</Badge>;
    }
    if (isTomorrow(followupDate)) {
      return <Badge variant="secondary" className="text-xs">Mañana</Badge>;
    }
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {format(followupDate, "d MMM", { locale: es })}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, empresa o email..."
            value={filters.search || ""}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(showFilters && "bg-muted")}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <label className="text-sm font-medium mb-2 block">Canal</label>
            <Select
              value={filters.channel || "all"}
              onValueChange={(value) => onFiltersChange({ ...filters, channel: value as Channel | 'all' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los canales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="phone">Teléfono</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Estado</label>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) => onFiltersChange({ ...filters, status: value as LeadStatus | 'all' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="new">Nuevo</SelectItem>
                <SelectItem value="contacted">Contactado</SelectItem>
                <SelectItem value="negotiation">Negociación</SelectItem>
                <SelectItem value="won">Ganado</SelectItem>
                <SelectItem value="lost">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              variant="ghost"
              onClick={() => onFiltersChange({ search: filters.search })}
              className="w-full"
            >
              Limpiar filtros
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Follow-up</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No se encontraron leads
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => {
                const ChannelIcon = channelIcons[lead.channel];
                return (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onLeadClick?.(lead)}
                  >
                    <TableCell className="font-medium">
                      <div>
                        {lead.name}
                        {lead.email && (
                          <p className="text-xs text-muted-foreground">{lead.email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={cn("inline-flex items-center gap-1 px-2 py-1 rounded", channelColors[lead.channel])}>
                        <ChannelIcon className="h-3 w-3" />
                        <span className="text-xs capitalize">{lead.channel}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", statusColors[lead.status])}>
                        {statusLabels[lead.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {lead.company && (
                        <div className="flex items-center gap-1 text-sm">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          {lead.company}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {getFollowupIndicator(lead)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(lead.created_at), "d MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onLeadClick?.(lead);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {onDeleteLead && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteLead(lead);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
