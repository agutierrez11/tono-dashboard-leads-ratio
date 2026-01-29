import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Phone, 
  PhoneCall, 
  Mail, 
  Linkedin, 
  Trophy,
  Zap,
  Edit2,
  Check,
  TrendingUp,
  UserPlus
} from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useTodayActivities, useMonthlyActivities, useIncrementActivity } from "@/hooks/useActivities";
import { useMonthlyGoal, useSetMonthlyGoal } from "@/hooks/useGoals";

const getLevelInfo = (dealsCount: number) => {
  if (dealsCount >= 50) return { level: 3, name: "🦈 Shark", color: "text-purple-500", next: null };
  if (dealsCount >= 25) return { level: 2, name: "🎯 Cazador", color: "text-blue-500", next: 50 };
  if (dealsCount >= 10) return { level: 1, name: "🔍 Explorador", color: "text-green-500", next: 25 };
  return { level: 0, name: "🌱 Novato", color: "text-muted-foreground", next: 10 };
};

export const GamificationPanel = () => {
  const { data: leads = [] } = useLeads();
  const { data: todayActivities } = useTodayActivities();
  const { data: monthlyActivities = [] } = useMonthlyActivities();
  const { data: monthlyGoal } = useMonthlyGoal();
  const incrementActivity = useIncrementActivity();
  const setMonthlyGoal = useSetMonthlyGoal();
  
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalValue, setGoalValue] = useState("");

  // Calculate monthly stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const monthlyLeads = leads.filter(lead => 
    new Date(lead.created_at) >= startOfMonth
  );
  const monthlyWon = monthlyLeads.filter(lead => lead.status === "won").length;
  const monthlyAdded = monthlyLeads.length;
  
  // Total points: each added = 1pt, each won = 5pts
  const totalPoints = monthlyAdded + (monthlyWon * 5);
  
  const levelInfo = getLevelInfo(monthlyAdded);
  const goalTarget = monthlyGoal?.target_value || 0;
  const goalProgress = goalTarget > 0 ? Math.min((monthlyAdded / goalTarget) * 100, 100) : 0;

  // Monthly activity totals
  const monthlyActivityTotals = monthlyActivities.reduce((acc, day) => ({
    calls_made: acc.calls_made + day.calls_made,
    calls_connected: acc.calls_connected + day.calls_connected,
    emails_sent: acc.emails_sent + day.emails_sent,
    linkedin_contacts: acc.linkedin_contacts + day.linkedin_contacts,
  }), { calls_made: 0, calls_connected: 0, emails_sent: 0, linkedin_contacts: 0 });

  const handleSaveGoal = () => {
    const value = parseInt(goalValue);
    if (value > 0) {
      setMonthlyGoal.mutate({ targetValue: value });
      setIsEditingGoal(false);
      setGoalValue("");
    }
  };

  const handleIncrement = (type: "calls_made" | "calls_connected" | "emails_sent" | "linkedin_contacts") => {
    incrementActivity.mutate({ activityType: type });
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Centro de Gamificación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Level & Points Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-lg p-3 border">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">Nivel Actual</span>
            </div>
            <p className={`font-bold ${levelInfo.color}`}>{levelInfo.name}</p>
            {levelInfo.next && (
              <p className="text-xs text-muted-foreground">
                {levelInfo.next - monthlyAdded} deals para siguiente nivel
              </p>
            )}
          </div>
          
          <div className="bg-card rounded-lg p-3 border">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Puntos del Mes</span>
            </div>
            <p className="text-2xl font-bold">{totalPoints}</p>
            <p className="text-xs text-muted-foreground">
              +{monthlyAdded} ingresados, +{monthlyWon * 5} cerrados
            </p>
          </div>
        </div>

        {/* Monthly Goal */}
        <div className="bg-card rounded-lg p-3 border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Meta Mensual de Deals</span>
            </div>
            {!isEditingGoal ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2"
                onClick={() => {
                  setGoalValue(goalTarget.toString());
                  setIsEditingGoal(true);
                }}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            ) : (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={goalValue}
                  onChange={(e) => setGoalValue(e.target.value)}
                  className="h-7 w-20 text-sm"
                  placeholder="Meta"
                  min={1}
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2"
                  onClick={handleSaveGoal}
                  disabled={setMonthlyGoal.isPending}
                >
                  <Check className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          
          {goalTarget > 0 ? (
            <>
              <Progress value={goalProgress} className="h-3 mb-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{monthlyAdded} de {goalTarget} deals</span>
                <span>{goalProgress.toFixed(0)}%</span>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Haz clic en el lápiz para establecer tu meta mensual
            </p>
          )}
        </div>

        {/* Quick Activity Buttons */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Actividades Rápidas (Hoy)</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-between h-auto py-2 px-3"
              onClick={() => handleIncrement("calls_made")}
              disabled={incrementActivity.isPending}
            >
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-orange-500" />
                <span className="text-xs">Llamada</span>
              </div>
              <span className="font-bold">{todayActivities?.calls_made || 0}</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-between h-auto py-2 px-3"
              onClick={() => handleIncrement("calls_connected")}
              disabled={incrementActivity.isPending}
            >
              <div className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-green-500" />
                <span className="text-xs">Conectada</span>
              </div>
              <span className="font-bold">{todayActivities?.calls_connected || 0}</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-between h-auto py-2 px-3"
              onClick={() => handleIncrement("emails_sent")}
              disabled={incrementActivity.isPending}
            >
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500" />
                <span className="text-xs">Email</span>
              </div>
              <span className="font-bold">{todayActivities?.emails_sent || 0}</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-between h-auto py-2 px-3"
              onClick={() => handleIncrement("linkedin_contacts")}
              disabled={incrementActivity.isPending}
            >
              <div className="flex items-center gap-2">
                <Linkedin className="h-4 w-4 text-[#0077B5]" />
                <span className="text-xs">LinkedIn</span>
              </div>
              <span className="font-bold">{todayActivities?.linkedin_contacts || 0}</span>
            </Button>
          </div>
          
          {/* Monthly totals */}
          <div className="bg-muted/50 rounded-lg p-2 mt-2">
            <p className="text-xs text-muted-foreground text-center">
              Este mes: {monthlyActivityTotals.calls_made} llamadas · {monthlyActivityTotals.calls_connected} conectadas · {monthlyActivityTotals.emails_sent} emails · {monthlyActivityTotals.linkedin_contacts} LinkedIn
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
