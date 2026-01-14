
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lead, LeadStatus, NoteType } from "@/utils/types";
import { useLeadNotes } from "@/hooks/useLeads";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Linkedin, Phone, Mail, Calendar, MessageSquare, PhoneCall, Video, ClipboardCheck, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const leadFormSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(["new", "contacted", "negotiation", "won", "lost"]),
  next_followup_at: z.date().optional().nullable(),
  sale_value: z.number().optional().nullable(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface LeadDetailDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (lead: Partial<Lead> & { id: string }) => Promise<void>;
}

const noteTypeIcons = {
  note: MessageSquare,
  call: PhoneCall,
  email: Mail,
  meeting: Video,
  followup: ClipboardCheck,
};

const noteTypeLabels: Record<NoteType, string> = {
  note: "Nota",
  call: "Llamada",
  email: "Email",
  meeting: "Reunión",
  followup: "Seguimiento",
};

export const LeadDetailDialog = ({ lead, open, onOpenChange, onSave }: LeadDetailDialogProps) => {
  const [saving, setSaving] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("note");
  const [addingNote, setAddingNote] = useState(false);

  const { notes, addNote, isLoading: notesLoading } = useLeadNotes(lead?.id || "");

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: lead?.name || "",
      email: lead?.email || "",
      phone: lead?.phone || "",
      company: lead?.company || "",
      status: lead?.status || "new",
      next_followup_at: lead?.next_followup_at ? new Date(lead.next_followup_at) : null,
      sale_value: lead?.sale_value || null,
    },
  });

  // Reset form when lead changes
  if (lead && form.getValues("name") !== lead.name) {
    form.reset({
      name: lead.name,
      email: lead.email || "",
      phone: lead.phone || "",
      company: lead.company || "",
      status: lead.status,
      next_followup_at: lead.next_followup_at ? new Date(lead.next_followup_at) : null,
      sale_value: lead.sale_value || null,
    });
  }

  const onSubmit = async (values: LeadFormValues) => {
    if (!lead) return;
    setSaving(true);
    try {
      await onSave({
        id: lead.id,
        name: values.name,
        email: values.email || undefined,
        phone: values.phone || undefined,
        company: values.company || undefined,
        status: values.status as LeadStatus,
        next_followup_at: values.next_followup_at?.toISOString(),
        sale_value: values.sale_value || undefined,
      });
      toast.success("Lead actualizado");
      onOpenChange(false);
    } catch (error) {
      toast.error("Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    setAddingNote(true);
    try {
      await addNote({ content: noteContent, note_type: noteType });
      setNoteContent("");
      toast.success("Nota agregada");
    } catch (error) {
      toast.error("Error al agregar nota");
    } finally {
      setAddingNote(false);
    }
  };

  const channelIcons = {
    linkedin: Linkedin,
    phone: Phone,
    email: Mail,
  };

  const ChannelIcon = lead ? channelIcons[lead.channel] : Mail;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {lead && <ChannelIcon className="h-5 w-5" />}
            {lead?.name || "Detalle del Lead"}
          </DialogTitle>
          <DialogDescription>
            {lead?.company && `${lead.company} • `}
            Creado el {lead ? format(new Date(lead.created_at), "d 'de' MMMM, yyyy", { locale: es }) : ""}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="notes">Notas y Actividad</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                            <SelectItem value="new">Nuevo</SelectItem>
                            <SelectItem value="contacted">Contactado</SelectItem>
                            <SelectItem value="negotiation">Negociación</SelectItem>
                            <SelectItem value="won">Ganado</SelectItem>
                            <SelectItem value="lost">Perdido</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sale_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor de venta</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          />
                        </FormControl>
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
                      <FormLabel>Próximo seguimiento</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
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
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar cambios"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4 mt-4">
            {/* Add Note Form */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex gap-2">
                {(Object.keys(noteTypeIcons) as NoteType[]).map((type) => {
                  const Icon = noteTypeIcons[type];
                  return (
                    <Button
                      key={type}
                      size="sm"
                      variant={noteType === type ? "default" : "outline"}
                      onClick={() => setNoteType(type)}
                    >
                      <Icon className="h-4 w-4 mr-1" />
                      {noteTypeLabels[type]}
                    </Button>
                  );
                })}
              </div>
              <Textarea
                placeholder="Escribe una nota..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddNote} disabled={addingNote || !noteContent.trim()}>
                {addingNote ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Agregando...
                  </>
                ) : (
                  "Agregar nota"
                )}
              </Button>
            </div>

            {/* Notes List */}
            <div className="space-y-3">
              {notesLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Sin notas todavía
                </div>
              ) : (
                notes.map((note) => {
                  const Icon = noteTypeIcons[note.note_type as NoteType] || MessageSquare;
                  return (
                    <div key={note.id} className="flex gap-3 p-3 border rounded-lg">
                      <div className="bg-muted rounded-full p-2 h-fit">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {noteTypeLabels[note.note_type as NoteType] || note.note_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(note.created_at), "d MMM, HH:mm", { locale: es })}
                          </span>
                        </div>
                        <p className="text-sm">{note.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
