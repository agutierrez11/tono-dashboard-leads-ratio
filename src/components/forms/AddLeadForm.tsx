
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Linkedin, Phone, Mail, Plus, CheckCircle } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }).max(100, {
    message: "El nombre no puede tener más de 100 caracteres.",
  }),
  company: z.string().max(100, {
    message: "La empresa no puede tener más de 100 caracteres.",
  }).optional(),
  channel: z.enum(["linkedin", "phone", "email"], {
    required_error: "Por favor selecciona un canal.",
  }),
  status: z.enum(["new", "contacted", "qualified", "proposal", "closed", "lost"], {
    required_error: "Por favor selecciona una etapa.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export const AddLeadForm = () => {
  const [loading, setLoading] = useState(false);
  const [addAnother, setAddAnother] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      company: "",
      channel: "linkedin",
      status: "new",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast.error("Debes iniciar sesión para agregar leads");
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.from("leads").insert({
        name: values.name.trim(),
        company: values.company?.trim() || null,
        channel: values.channel,
        status: values.status,
        user_id: user.id,
      });

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead agregado exitosamente", {
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      });
      
      if (addAnother) {
        form.reset({
          name: "",
          company: "",
          channel: values.channel, // Keep the same channel
          status: "new",
        });
      } else {
        form.reset();
      }
    } catch (error: any) {
      toast.error("Error al guardar: " + (error.message || "Intenta de nuevo"));
    } finally {
      setLoading(false);
    }
  };

  const channelButtons = [
    { value: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-linkedin bg-linkedin/10 border-linkedin/30 hover:bg-linkedin/20" },
    { value: "phone", label: "Teléfono", icon: Phone, color: "text-phone bg-phone/10 border-phone/30 hover:bg-phone/20" },
    { value: "email", label: "Email", icon: Mail, color: "text-email bg-email/10 border-email/30 hover:bg-email/20" },
  ];

  const statusOptions = [
    { value: "new", label: "🆕 Nuevo", description: "Lead recién captado" },
    { value: "contacted", label: "📞 Contactado", description: "Primera comunicación realizada" },
    { value: "qualified", label: "✅ Calificado", description: "Lead con potencial confirmado" },
    { value: "proposal", label: "📋 Propuesta", description: "Propuesta enviada" },
    { value: "closed", label: "🎉 Cerrado", description: "Venta concretada" },
    { value: "lost", label: "❌ Perdido", description: "No se concretó" },
  ];

  return (
    <Card className="glass-card w-full max-w-2xl mx-auto animate-scale-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Agregar Lead
        </CardTitle>
        <CardDescription>
          Registra un nuevo prospecto de forma rápida y sencilla.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Channel Selection - Visual Buttons */}
            <FormField
              control={form.control}
              name="channel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Canal de captación</FormLabel>
                  <div className="grid grid-cols-3 gap-3">
                    {channelButtons.map((channel) => {
                      const Icon = channel.icon;
                      const isSelected = field.value === channel.value;
                      return (
                        <button
                          key={channel.value}
                          type="button"
                          onClick={() => field.onChange(channel.value)}
                          className={`
                            flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
                            ${isSelected 
                              ? channel.color + " border-current shadow-md scale-105" 
                              : "border-muted hover:border-muted-foreground/30 hover:bg-muted/50"
                            }
                          `}
                        >
                          <Icon className={`h-6 w-6 mb-1 ${isSelected ? "" : "text-muted-foreground"}`} />
                          <span className={`text-sm font-medium ${isSelected ? "" : "text-muted-foreground"}`}>
                            {channel.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Juan García López" 
                      {...field} 
                      autoFocus
                      className="text-lg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company Field - Optional */}
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa <span className="text-muted-foreground text-xs">(opcional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Tech Solutions S.A." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status/Stage Field */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etapa del embudo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="text-base">
                        <SelectValue placeholder="Selecciona una etapa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1"
                size="lg"
              >
                {loading ? "Guardando..." : "Guardar Lead"}
              </Button>
              <Button 
                type="submit"
                variant="outline"
                disabled={loading}
                onClick={() => setAddAnother(true)}
                onMouseDown={() => setAddAnother(true)}
                className="flex-1"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Guardar y agregar otro
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
