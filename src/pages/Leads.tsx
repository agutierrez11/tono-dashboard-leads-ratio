import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AddLeadForm } from "@/components/forms/AddLeadForm";

const Leads = () => {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agregar Lead</h1>
          <p className="text-muted-foreground mt-1">
            Registra información de nuevos contactos y prospectos.
          </p>
        </div>
        
        <AddLeadForm />
      </div>
    </DashboardLayout>
  );
};

export default Leads;
