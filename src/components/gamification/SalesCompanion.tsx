import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, MessageCircle, Sparkles } from "lucide-react";
import { useUserProfile, useCreateOrUpdateProfile } from "@/hooks/useUserProfile";
import { useTodayActivities, useMonthlyActivities } from "@/hooks/useActivities";
import { useLeads } from "@/hooks/useLeads";
import { useMonthlyGoal } from "@/hooks/useGoals";
import { AvatarSelector } from "./AvatarSelector";

const getAvatarEmoji = (type: string, style: string) => {
  const avatarMap: Record<string, string> = {
    "male-professional": "👨‍💼",
    "male-casual": "🧑",
    "male-tech": "👨‍💻",
    "female-professional": "👩‍💼",
    "female-casual": "👩",
    "female-tech": "👩‍💻",
    "robot-default": "🤖",
    "shark-default": "🦈",
  };
  return avatarMap[`${type}-${style}`] || "🤖";
};

const getMotivationalMessages = (
  name: string,
  todayCalls: number,
  todayEmails: number,
  todayLinkedin: number,
  monthlyLeads: number,
  monthlyGoal: number,
  monthlyWon: number
) => {
  const messages: string[] = [];
  const displayName = name || "Campeón";
  const now = new Date();
  const hour = now.getHours();

  // Time-based greeting
  if (hour < 12) {
    messages.push(`¡Buenos días, ${displayName}! ☀️ ¿Listo para conquistar el día?`);
  } else if (hour < 18) {
    messages.push(`¡Buenas tardes, ${displayName}! 💪 ¿Cómo va la cacería de leads?`);
  } else {
    messages.push(`¡Buenas noches, ${displayName}! 🌙 ¡Gran esfuerzo hoy!`);
  }

  // Activity-based messages
  if (todayCalls === 0 && todayEmails === 0) {
    messages.push(`${displayName}, ¿ya hiciste tu primera llamada del día? 📞`);
    messages.push(`¡Vamos ${displayName}! El primer contacto del día es el más importante.`);
  } else if (todayCalls >= 10) {
    messages.push(`¡WOW ${displayName}! 🔥 ${todayCalls} llamadas hoy, ¡eres una máquina!`);
  } else if (todayCalls >= 5) {
    messages.push(`¡Bien ${displayName}! ${todayCalls} llamadas. ¿Vamos por 10? 🎯`);
  }

  if (todayEmails >= 10) {
    messages.push(`📧 ${todayEmails} emails enviados. ¡Tu inbox está on fire!`);
  }

  if (todayLinkedin >= 5) {
    messages.push(`💼 ${todayLinkedin} contactos en LinkedIn. ¡Networking master!`);
  }

  // Goal-based messages
  if (monthlyGoal > 0) {
    const progress = (monthlyLeads / monthlyGoal) * 100;
    if (progress >= 100) {
      messages.push(`🏆 ¡INCREÍBLE ${displayName}! ¡Superaste tu meta mensual!`);
    } else if (progress >= 75) {
      messages.push(`🚀 ¡Casi lo logras! ${Math.round(progress)}% de tu meta. ¡Final push!`);
    } else if (progress >= 50) {
      messages.push(`💪 ¡Mitad del camino! ${Math.round(progress)}% completado.`);
    }
  }

  // Won deals celebration
  if (monthlyWon > 0) {
    messages.push(`🎉 ¡${monthlyWon} deals cerrados este mes! ¡Cha-ching!`);
  }

  return messages;
};

export const SalesCompanion = () => {
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: todayActivities } = useTodayActivities();
  const { data: leads = [] } = useLeads();
  const { data: monthlyGoal } = useMonthlyGoal();
  const updateProfile = useCreateOrUpdateProfile();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarType, setAvatarType] = useState("robot");
  const [avatarStyle, setAvatarStyle] = useState("default");
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Calculate monthly stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyLeads = leads.filter(lead => new Date(lead.created_at) >= startOfMonth);
  const monthlyWon = monthlyLeads.filter(lead => lead.status === "won").length;

  const messages = useMemo(() => getMotivationalMessages(
    profile?.display_name || "",
    todayActivities?.calls_made || 0,
    todayActivities?.emails_sent || 0,
    todayActivities?.linkedin_contacts || 0,
    monthlyLeads.length,
    monthlyGoal?.target_value || 0,
    monthlyWon
  ), [profile?.display_name, todayActivities, monthlyLeads.length, monthlyGoal, monthlyWon]);

  // Rotate messages every 8 seconds
  useEffect(() => {
    if (messages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [messages.length]);

  // Sync profile to local state
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setAvatarType(profile.avatar_type || "robot");
      setAvatarStyle(profile.avatar_style || "default");
    }
  }, [profile]);

  const handleSaveProfile = () => {
    updateProfile.mutate({ 
      displayName, 
      avatarType, 
      avatarStyle 
    });
    setIsSettingsOpen(false);
  };

  const avatarEmoji = getAvatarEmoji(
    profile?.avatar_type || avatarType, 
    profile?.avatar_style || avatarStyle
  );

  const showSetup = !profile && !profileLoading;

  return (
    <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Animated Avatar */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-4xl animate-pulse shadow-lg">
              {avatarEmoji}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background animate-pulse" />
          </div>

          {/* Message Area */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">
                Tu Compañero de Ventas
              </span>
              <Sparkles className="h-3 w-3 text-yellow-500" />
            </div>

            {showSetup ? (
              <p className="text-sm text-muted-foreground">
                ¡Hola! Soy tu compañero de ventas. Haz clic en ⚙️ para personalizarme.
              </p>
            ) : (
              <p className="text-sm font-medium leading-relaxed transition-all duration-500">
                {messages[currentMessageIndex]}
              </p>
            )}

            {/* Quick Stats Pills */}
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                📞 {todayActivities?.calls_made || 0} hoy
              </span>
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                📧 {todayActivities?.emails_sent || 0} hoy
              </span>
              <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                💼 {todayActivities?.linkedin_contacts || 0} hoy
              </span>
            </div>
          </div>

          {/* Settings Button */}
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Personaliza tu Compañero</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tu nombre</label>
                  <Input
                    placeholder="¿Cómo te llamo?"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Elige tu avatar</label>
                  <AvatarSelector
                    selectedType={avatarType}
                    selectedStyle={avatarStyle}
                    onSelect={(type, style) => {
                      setAvatarType(type);
                      setAvatarStyle(style);
                    }}
                  />
                </div>
                <Button 
                  onClick={handleSaveProfile} 
                  className="w-full"
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};
