
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AddLeadForm } from "@/components/forms/AddLeadForm";
import { useLeadsStore } from "@/hooks/useLeadsStore";

const Leads = () => {
  const { leads, addLead } = useLeadsStore();
  
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agregar Leads</h1>
          <p className="text-muted-foreground mt-1">
            Registro rápido de contactos y prospectos.
          </p>
          {leads.length > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Total de leads: <span className="font-semibold text-foreground">{leads.length}</span>
            </p>
          )}
        </div>
        
        <AddLeadForm onSave={addLead} />
      </div>
    </DashboardLayout>
  );
};

export default Leads;
