
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Linkedin, Phone, Mail, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
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
import { cn } from "@/lib/utils";
import { Lead } from "@/utils/types";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  company: z.string().min(1, {
    message: "La empresa es requerida.",
  }),
  channel: z.enum(["linkedin", "phone", "email"], {
    required_error: "Por favor selecciona un canal.",
  }),
  status: z.enum(["new", "contacted", "qualified", "proposal", "closed", "lost"], {
    required_error: "Por favor selecciona un estado.",
  }),
  date: z.date({
    required_error: "La fecha es requerida.",
  }),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddLeadFormProps {
  onSave?: (lead: Lead) => void;
}

export const AddLeadForm = ({ onSave }: AddLeadFormProps) => {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      company: "",
      channel: "linkedin",
      status: "new",
      date: new Date(),
      notes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newLead: Lead = {
        id: `lead-${Date.now()}`,
        name: values.name,
        company: values.company,
        channel: values.channel,
        status: values.status,
        date: values.date,
        notes: values.notes,
      };
      
      if (onSave) {
        onSave(newLead);
      }
      
      toast.success("Lead agregado exitosamente");
      form.reset();
    } catch (error) {
      toast.error("Error al guardar el lead");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "linkedin":
        return <Linkedin className="h-4 w-4" />;
      case "phone":
        return <Phone className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className="glass-card w-full max-w-3xl mx-auto animate-scale-in">
      <CardHeader>
        <CardTitle>Agregar Nuevo Lead</CardTitle>
        <CardDescription>
          Registra la información de un nuevo prospecto o contacto.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del contacto</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Empresa S.A." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="channel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canal</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un canal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="linkedin" className="flex items-center">
                          <div className="flex items-center gap-2">
                            <Linkedin className="h-4 w-4 text-linkedin" />
                            <span>LinkedIn</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="phone">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-phone" />
                            <span>Teléfono</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-email" />
                            <span>Email</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new">Nuevo</SelectItem>
                        <SelectItem value="contacted">Contactado</SelectItem>
                        <SelectItem value="qualified">Calificado</SelectItem>
                        <SelectItem value="proposal">Propuesta</SelectItem>
                        <SelectItem value="closed">Cerrado</SelectItem>
                        <SelectItem value="lost">Perdido</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha</FormLabel>
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
                              format(field.value, "PPP")
                            ) : (
                              <span>Selecciona una fecha</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Información adicional sobre el contacto..."
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <CardFooter className="px-0 pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar Lead"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
