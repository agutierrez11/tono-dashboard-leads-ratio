import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Linkedin, Phone, Mail, Send, Check } from "lucide-react";
import { useCreateLead } from "@/hooks/useLeads";
import { useIncrementActivity } from "@/hooks/useActivities";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ChannelType = "linkedin" | "phone" | "email";

export const QuickOutreachLogger = () => {
  const [inputText, setInputText] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<ChannelType>("linkedin");
  const [phoneConnected, setPhoneConnected] = useState(false);
  const [isInterested, setIsInterested] = useState(false);
  const [loading, setLoading] = useState(false);

  const createLead = useCreateLead();
  const incrementActivity = useIncrementActivity();
  const { user } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Debes iniciar sesión para registrar actividades");
      return;
    }

    const trimmedInput = inputText.trim();
    if (!trimmedInput) {
      toast.error("Por favor ingresa un nombre o empresa");
      return;
    }

    setLoading(true);

    try {
      // Parse name and company from input (e.g. "Juan Perez - Pepsi" or "Pepsi")
      let name = trimmedInput;
      let company: string | null = null;

      if (trimmedInput.includes("-")) {
        const parts = trimmedInput.split("-");
        if (parts.length >= 2) {
          name = parts[0].trim();
          company = parts[1].trim();
        }
      }

      // Determine initial lead status based on options checked
      let initialStatus = "new";
      if (selectedChannel === "phone") {
        initialStatus = phoneConnected ? "contacted" : "new";
      } else {
        initialStatus = isInterested ? "qualified" : "contacted";
      }

      // 1. Create Lead in database
      const leadData = {
        name,
        company,
        email: null,
        phone: null,
        channel: selectedChannel,
        status: initialStatus,
        source: "Outreach Rápido",
        user_id: user.id,
        contacted_at: new Date().toISOString(),
        closed_at: null,
        next_followup_at: null,
        sale_value: null,
        sale_cycle_days: null,
      };

      await createLead.mutateAsync(leadData);

      // 2. Increment activity counts for today
      if (selectedChannel === "linkedin") {
        await incrementActivity.mutateAsync({ activityType: "linkedin_contacts" });
      } else if (selectedChannel === "email") {
        await incrementActivity.mutateAsync({ activityType: "emails_sent" });
      } else if (selectedChannel === "phone") {
        await incrementActivity.mutateAsync({ activityType: "calls_made" });
        if (phoneConnected) {
          await incrementActivity.mutateAsync({ activityType: "calls_connected" });
        }
      }

      // 3. Increment meetings booked if they marked "interested"
      if (isInterested && selectedChannel !== "phone") {
        await incrementActivity.mutateAsync({ activityType: "meetings_booked" });
      }

      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-sm">Outreach Registrado</span>
          <span className="text-xs text-muted-foreground">
            {name} {company ? `@ ${company}` : ""} agregado y sumado a tus metas diarias.
          </span>
        </div>
      );

      // Reset fields
      setInputText("");
      setPhoneConnected(false);
      setIsInterested(false);
    } catch (error: any) {
      toast.error("Error al registrar: " + (error.message || "Intenta nuevamente"));
    } finally {
      setLoading(false);
    }
  };

  const channelConfig = [
    { key: "linkedin" as ChannelType, label: "LinkedIn", icon: Linkedin, color: "text-linkedin bg-linkedin/10 border-linkedin/30 hover:bg-linkedin/20" },
    { key: "phone" as ChannelType, label: "Llamada", icon: Phone, color: "text-phone bg-phone/10 border-phone/30 hover:bg-phone/20" },
    { key: "email" as ChannelType, label: "Email", icon: Mail, color: "text-email bg-email/10 border-email/30 hover:bg-email/20" },
  ];

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-xl transition-all duration-300 hover:shadow-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Send className="h-5 w-5 text-primary animate-pulse" />
          Registro de Outreach Rápido
        </CardTitle>
        <CardDescription>
          Ingresa un prospecto y regístralo en tus metas diarias con un solo clic.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quick-lead-input" className="text-xs text-muted-foreground">
              Nombre y Empresa (usa "-" para separar)
            </Label>
            <Input
              id="quick-lead-input"
              placeholder="Ej: Juan Pérez - Pepsi o Pepsi Co."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="text-base h-11 focus-visible:ring-primary/40 focus-visible:ring-2"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
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
                    "flex flex-col sm:flex-row items-center justify-center gap-1.5 h-14 sm:h-10 transition-all border-2",
                    isSelected
                      ? channel.color + " border-current scale-[1.03] font-semibold"
                      : "border-muted text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/50"
                  )}
                  disabled={loading}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">{channel.label}</span>
                </Button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            {selectedChannel === "phone" ? (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="phone-connected"
                  checked={phoneConnected}
                  onCheckedChange={(checked) => setPhoneConnected(!!checked)}
                  disabled={loading}
                  className="border-phone/50 data-[state=checked]:bg-phone data-[state=checked]:border-phone"
                />
                <Label htmlFor="phone-connected" className="text-xs sm:text-sm cursor-pointer select-none">
                  📞 ¿Llamada contestada / conectada?
                </Label>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="interested"
                  checked={isInterested}
                  onCheckedChange={(checked) => setIsInterested(!!checked)}
                  disabled={loading}
                  className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label htmlFor="interested" className="text-xs sm:text-sm cursor-pointer select-none">
                  ✨ ¿Respondió o mostró interés directo?
                </Label>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="w-full sm:w-auto h-10 px-6 font-semibold"
            >
              {loading ? (
                "Guardando..."
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Registrar Outreach
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
