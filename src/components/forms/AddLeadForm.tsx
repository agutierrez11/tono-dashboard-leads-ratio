
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Linkedin, Phone, Mail, Calendar, Plus, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Lead, Channel, LeadStatus } from "@/utils/types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  company: z.string().optional(),
  channel: z.enum(["linkedin", "phone", "email"], {
    required_error: "Por favor selecciona un canal.",
  }),
  status: z.enum(["new", "contacted", "negotiation", "won", "lost"], {
    required_error: "Por favor selecciona un estado.",
  }),
  next_followup_at: z.date().optional().nullable(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RecentLead {
  id: string;
  name: string;
  channel: Channel;
  company?: string;
}

interface AddLeadFormProps {
  onSave?: (lead: Omit<Lead, "id" | "user_id" | "created_at" | "updated_at">) => Promise<any>;
  isLoading?: boolean;
}

const channelOptions: { value: Channel; label: string; icon: typeof Linkedin; colorClass: string }[] = [
  { value: "linkedin", label: "LinkedIn", icon: Linkedin, colorClass: "text-linkedin border-linkedin bg-linkedin/10" },
  { value: "phone", label: "Teléfono", icon: Phone, colorClass: "text-phone border-phone bg-phone/10" },
  { value: "email", label: "Email", icon: Mail, colorClass: "text-email border-email bg-email/10" },
];

const statusOptions = [
  { value: "new", label: "Nuevo" },
  { value: "contacted", label: "Contactado" },
  { value: "negotiation", label: "Negociación" },
  { value: "won", label: "Ganado" },
  { value: "lost", label: "Perdido" },
];

export const AddLeadForm = ({ onSave, isLoading }: AddLeadFormProps) => {
  const [loading, setLoading] = useState(false);
  const [addAnother, setAddAnother] = useState(true);
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      company: "",
      channel: "linkedin",
      status: "new",
      next_followup_at: null,
      notes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!onSave) return;
    setLoading(true);
    
    try {
      const newLead = {
        name: values.name,
        company: values.company || undefined,
        channel: values.channel as Channel,
        status: values.status as LeadStatus,
        next_followup_at: values.next_followup_at?.toISOString(),
      };
      
      await onSave(newLead);
      
      setRecentLeads(prev => [{ id: Date.now().toString(), name: values.name, channel: values.channel as Channel, company: values.company }, ...prev].slice(0, 5));
      
      toast.success(`Lead "${values.name}" agregado`, {
        description: `Canal: ${channelOptions.find(c => c.value === values.channel)?.label}`,
      });
      
      if (addAnother) {
        form.reset({
          name: "",
          company: "",
          channel: values.channel,
          status: "new",
          next_followup_at: null,
          notes: "",
        });
        setTimeout(() => nameInputRef.current?.focus(), 100);
      } else {
        form.reset();
      }
    } catch (error) {
      toast.error("Error al guardar el lead");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <Card className="glass-card flex-1 animate-scale-in">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Registro Rápido
          </CardTitle>
          <CardDescription>
            Agrega leads de forma rápida. Solo el nombre y canal son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="channel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canal de contacto</FormLabel>
                    <div className="flex gap-2">
                      {channelOptions.map((channel) => {
                        const Icon = channel.icon;
                        const isSelected = field.value === channel.value;
                        return (
                          <button
                            key={channel.value}
                            type="button"
                            onClick={() => field.onChange(channel.value)}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all duration-200",
                              isSelected 
                                ? channel.colorClass + " border-current" 
                                : "border-border hover:border-muted-foreground/50 text-muted-foreground"
                            )}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="font-medium">{channel.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del contacto *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Escribe el nombre..." 
                        {...field} 
                        ref={nameInputRef}
                        className="text-lg py-6"
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre de empresa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="next_followup_at"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Próximo seguimiento (opcional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "d MMM yyyy", { locale: es })
                            ) : (
                              <span>Sin fecha programada</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Switch id="add-another" checked={addAnother} onCheckedChange={setAddAnother} />
                  <Label htmlFor="add-another" className="text-sm text-muted-foreground">
                    Agregar otro después
                  </Label>
                </div>
                
                <Button type="submit" disabled={loading || isLoading} size="lg" className="min-w-[140px]">
                  {loading ? "Guardando..." : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Lead
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {recentLeads.length > 0 && (
        <Card className="glass-card w-full lg:w-72 animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Agregados recientemente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentLeads.map((lead) => {
              const channelInfo = channelOptions.find(c => c.value === lead.channel);
              const Icon = channelInfo?.icon || Linkedin;
              return (
                <div key={lead.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 animate-slide-in">
                  <div className={cn("p-1.5 rounded-md", channelInfo?.colorClass)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{lead.name}</p>
                    {lead.company && <p className="text-xs text-muted-foreground truncate">{lead.company}</p>}
                  </div>
                  <Check className="h-4 w-4 text-green-500" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
