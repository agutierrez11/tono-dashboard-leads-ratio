import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MapPin, MessageSquare, Phone, Mail, Linkedin, Send, Check } from "lucide-react";
import { useMeliCockpit } from "@/hooks/useMeliCockpit";
import { TouchType } from "@/types/crm";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ChannelType = "cambaceo" | "whatsapp" | "phone" | "email" | "linkedin";

export const QuickOutreachLogger = () => {
  const [inputText, setInputText] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<ChannelType>("cambaceo");
  const [answeredOrConnected, setAnsweredOrConnected] = useState(true);
  const [isInterested, setIsInterested] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const { activeLeads, addTouch, addLeadManual } = useMeliCockpit();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = inputText.trim();
    if (!trimmedInput) {
      toast.error("Por favor ingresa un nombre o comercio");
      return;
    }

    setLoading(true);

    try {
      // Parse name and company (e.g. "Juan Perez - Mariscos El Capi" or "Mariscos El Capi")
      let company = trimmedInput;
      let contactName = "Dueño / Encargado";

      if (trimmedInput.includes("-")) {
        const parts = trimmedInput.split("-");
        contactName = parts[0].trim();
        company = parts.slice(1).join("-").trim();
      }

      // Check if this lead already exists in active leads
      const existing = activeLeads.find(
        (l) =>
          l.company.toLowerCase() === company.toLowerCase() ||
          l.name.toLowerCase() === company.toLowerCase()
      );

      const touchType: TouchType = selectedChannel === "cambaceo" ? "cambaceo" : (selectedChannel as TouchType);
      const noteDetails = `${isInterested ? "[🔥 Interesado] " : ""}${notes ? notes : (answeredOrConnected ? "Contacto efectivo" : "Sin respuesta directa")}`;

      if (existing) {
        // Log touch on existing lead
        addTouch(existing.id, touchType, noteDetails);
      } else {
        // Create manual lead directly in local CRM
        addLeadManual({
          name: company,
          company: company,
          contact_person: contactName,
          stage: isInterested ? "proposal" : "contacted",
        });

        // The hook will append the lead to activeLeads
      }

      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-sm">✅ Acción de Outreach Registrada</span>
          <span className="text-xs text-muted-foreground">
            {company} • {channelConfig.find((c) => c.key === selectedChannel)?.label} (+1 toque en tu meta de hoy).
          </span>
        </div>
      );

      // Reset form
      setInputText("");
      setNotes("");
      setIsInterested(false);
      setAnsweredOrConnected(true);
    } catch (err: any) {
      toast.error("Error al registrar: " + (err.message || "Intenta nuevamente"));
    } finally {
      setLoading(false);
    }
  };

  const channelConfig = [
    {
      key: "cambaceo" as ChannelType,
      label: "Cambaceo / Visita",
      icon: MapPin,
      color: "text-purple-600 bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20",
    },
    {
      key: "whatsapp" as ChannelType,
      label: "WhatsApp",
      icon: MessageSquare,
      color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20",
    },
    {
      key: "phone" as ChannelType,
      label: "Llamada",
      icon: Phone,
      color: "text-blue-600 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20",
    },
    {
      key: "email" as ChannelType,
      label: "Email",
      icon: Mail,
      color: "text-amber-600 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20",
    },
    {
      key: "linkedin" as ChannelType,
      label: "LinkedIn",
      icon: Linkedin,
      color: "text-cyan-600 bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20",
    },
  ];

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Send className="h-4 w-4 text-primary" />
          Registro Rápido de Acciones en Campo
        </CardTitle>
        <CardDescription className="text-xs">
          Registra tus toques diarios de cambaceo, WhatsApps o llamadas con 1 solo clic (100% guardado local).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quick-lead-input" className="text-xs text-muted-foreground">
              Comercio o Contacto (ej: <em>Restaurante La Parrilla</em> o <em>Don Pedro - La Parrilla</em>)
            </Label>
            <Input
              id="quick-lead-input"
              placeholder="Ingresa nombre de negocio o prospecto..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="text-sm h-10"
              disabled={loading}
            />
          </div>

          {/* Selector de Canales con Cambaceo prioritario */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {channelConfig.map((channel) => {
              const Icon = channel.icon;
              const isSelected = selectedChannel === channel.key;
              return (
                <Button
                  key={channel.key}
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedChannel(channel.key)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 h-10 transition-all border text-xs",
                    isSelected
                      ? channel.color + " border-current font-semibold shadow-sm"
                      : "border-muted text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/50"
                  )}
                  disabled={loading}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{channel.label}</span>
                </Button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="interested"
                checked={isInterested}
                onCheckedChange={(checked) => setIsInterested(!!checked)}
                disabled={loading}
                className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label htmlFor="interested" className="text-xs cursor-pointer select-none">
                ✨ ¿Mostró interés directo / pidió cotización o demo?
              </Label>
            </div>

            <Button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="w-full sm:w-auto h-9 px-5 text-xs font-semibold"
            >
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Registrar Acción
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
