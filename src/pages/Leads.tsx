
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AddLeadForm } from "@/components/forms/AddLeadForm";
import { LeadsList } from "@/components/leads/LeadsList";
import { LeadDetailDialog } from "@/components/leads/LeadDetailDialog";
import { CSVImportExport } from "@/components/leads/CSVImportExport";
import { useLeads } from "@/hooks/useLeads";
import { Lead, LeadFilters } from "@/utils/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, List } from "lucide-react";
import { toast } from "sonner";

const Leads = () => {
  const [filters, setFilters] = useState<LeadFilters>({});
  const { leads, isLoading, addLead, updateLead, deleteLead, importLeads } = useLeads(filters);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailOpen(true);
  };

  const handleDeleteLead = async (lead: Lead) => {
    try {
      await deleteLead(lead.id);
      toast.success("Lead eliminado");
    } catch {
      toast.error("Error al eliminar");
    }
  };
  
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Leads</h1>
            <p className="text-muted-foreground mt-1">
              Agrega, importa y gestiona tus contactos.
            </p>
          </div>
          <CSVImportExport leads={leads} onImport={importLeads} />
        </div>

        <Tabs defaultValue="add">
          <TabsList>
            <TabsTrigger value="add">
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="h-4 w-4 mr-2" />
              Lista ({leads.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="add" className="mt-6">
            <AddLeadForm onSave={addLead} />
          </TabsContent>
          
          <TabsContent value="list" className="mt-6">
            <LeadsList
              leads={leads}
              filters={filters}
              onFiltersChange={setFilters}
              onLeadClick={handleLeadClick}
              onDeleteLead={handleDeleteLead}
            />
          </TabsContent>
        </Tabs>
      </div>

      <LeadDetailDialog
        lead={selectedLead}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onSave={updateLead}
      />
    </DashboardLayout>
  );
};

export default Leads;
