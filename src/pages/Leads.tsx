
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AddLeadForm } from "@/components/forms/AddLeadForm";
import { Lead } from "@/utils/types";
import { toast } from "sonner";

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  
  const handleSaveLead = (newLead: Lead) => {
    setLeads(prev => [...prev, newLead]);
    toast.success("Lead guardado exitosamente");
  };
  
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agregar Lead</h1>
          <p className="text-muted-foreground mt-1">
            Registra información de nuevos contactos y prospectos.
          </p>
        </div>
        
        <AddLeadForm onSave={handleSaveLead} />
      </div>
    </DashboardLayout>
  );
};

export default Leads;
