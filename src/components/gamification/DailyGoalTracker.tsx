import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Target, 
  Phone, 
  PhoneCall, 
  Mail, 
  Linkedin, 
  Edit2,
  Check,
  RotateCcw,
  PartyPopper,
  Calendar,
  Trophy,
  DollarSign
} from "lucide-react";
import { useTodayActivities, useIncrementActivity, useUpdateActivityValue } from "@/hooks/useActivities";
import { useDailyGoals, useSetDailyGoal, useResetTodayActivities, ActivityType } from "@/hooks/useDailyGoals";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const activityConfig = [
  { key: "calls_made" as ActivityType, label: "Llamadas", icon: Phone, color: "text-orange-400", bgColor: "bg-orange-500" },
  { key: "calls_connected" as ActivityType, label: "Conectadas", icon: PhoneCall, color: "text-green-400", bgColor: "bg-green-500" },
  { key: "emails_sent" as ActivityType, label: "Emails", icon: Mail, color: "text-blue-400", bgColor: "bg-blue-500" },
  { key: "linkedin_contacts" as ActivityType, label: "LinkedIn", icon: Linkedin, color: "text-[#0077B5]", bgColor: "bg-[#0077B5]" },
];

const outcomeConfig = [
  { key: "meetings_booked" as ActivityType, label: "Reuniones", icon: Calendar, color: "text-purple-400", bgColor: "bg-purple-500" },
  { key: "sales_won" as ActivityType, label: "Ventas Cerradas", icon: Trophy, color: "text-yellow-400", bgColor: "bg-yellow-500" },
];

export const DailyGoalTracker = () => {
  const { data: todayActivities } = useTodayActivities();
  const { data: dailyGoals = [] } = useDailyGoals();
  const incrementActivity = useIncrementActivity();
  const updateActivityValue = useUpdateActivityValue();
  const setDailyGoal = useSetDailyGoal();
  const resetActivities = useResetTodayActivities();
  
  const [editingGoal, setEditingGoal] = useState<ActivityType | null>(null);
  const [goalValues, setGoalValues] = useState<Record<ActivityType, string>>({
    calls_made: "",
    calls_connected: "",
    emails_sent: "",
    linkedin_contacts: "",
    meetings_booked: "",
    sales_won: "",
  });

  const [revenueInput, setRevenueInput] = useState("");
  const [isEditingRevenue, setIsEditingRevenue] = useState(false);

  useEffect(() => {
    if (todayActivities?.revenue_won !== undefined) {
      setRevenueInput(todayActivities.revenue_won.toString());
    }
  }, [todayActivities?.revenue_won]);

  const getGoalTarget = (goalType: ActivityType): number => {
    const goal = dailyGoals.find(g => g.goal_type === goalType);
    return goal?.target_value || 0;
  };

  const getCurrentValue = (goalType: ActivityType): number => {
    if (!todayActivities) return 0;
    return (todayActivities as any)[goalType] || 0;
  };

  const getProgress = (goalType: ActivityType): number => {
    const target = getGoalTarget(goalType);
    const current = getCurrentValue(goalType);
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const isGoalMet = (goalType: ActivityType): boolean => {
    const target = getGoalTarget(goalType);
    const current = getCurrentValue(goalType);
    return target > 0 && current >= target;
  };

  const handleSaveGoal = (goalType: ActivityType) => {
    const value = parseInt(goalValues[goalType]);
    if (!isNaN(value) && value >= 0) {
      setDailyGoal.mutate({ goalType, targetValue: value });
      setEditingGoal(null);
    }
  };

  const handleGoalValueChange = (goalType: ActivityType, value: string) => {
    setGoalValues(prev => ({ ...prev, [goalType]: value }));
  };

  const handleIncrement = (type: ActivityType) => {
    incrementActivity.mutate({ activityType: type as any });
  };

  const handleSaveRevenue = () => {
    const val = parseFloat(revenueInput);
    if (!isNaN(val) && val >= 0) {
      updateActivityValue.mutate({ activityType: "revenue_won", value: val });
      setIsEditingRevenue(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5 shadow-xl hover:shadow-primary/5 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <Target className="h-5 w-5 text-primary animate-pulse" />
            Metas y Resultados Diarios
          </CardTitle>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 hover:bg-destructive/10 hover:text-destructive transition-colors">
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Reiniciar</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Reiniciar contadores?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esto pondrá todos los contadores de hoy en cero (actividades, reuniones, ventas e ingresos). Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => {
                    resetActivities.mutate();
                    setRevenueInput("0");
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Reiniciar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-5">
        {/* Sección 1: Prospección Activa */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Prospección Activa
          </h4>
          <div className="space-y-3">
            {activityConfig.map(({ key, label, icon: Icon, color }) => {
              const target = getGoalTarget(key);
              const current = getCurrentValue(key);
              const progress = getProgress(key);
              const goalMet = isGoalMet(key);
              
              return (
                <div key={key} className={cn(
                  "bg-muted/30 rounded-lg p-3 border transition-all hover:bg-muted/40",
                  goalMet && "border-green-500/30 bg-green-500/5 hover:bg-green-500/10"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", color)} />
                      <span className="text-sm font-medium">{label}</span>
                      {goalMet && <PartyPopper className="h-4 w-4 text-yellow-500 animate-bounce" />}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {editingGoal === key ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={goalValues[key]}
                            onChange={(e) => handleGoalValueChange(key, e.target.value)}
                            className="h-7 w-16 text-sm bg-background border-primary/30"
                            placeholder="Meta"
                            min={0}
                            autoFocus
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 hover:bg-primary/20"
                            onClick={() => handleSaveGoal(key)}
                            disabled={setDailyGoal.isPending}
                          >
                            <Check className="h-3 w-3 text-primary" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="text-xs text-muted-foreground">
                            Meta: {target > 0 ? target : "—"}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 hover:bg-primary/10"
                            onClick={() => {
                              handleGoalValueChange(key, target.toString());
                              setEditingGoal(key);
                            }}
                          >
                            <Edit2 className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Progress 
                        value={progress} 
                        className={cn(
                          "h-2",
                          goalMet && "[&>div]:bg-green-500"
                        )} 
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{current} {target > 0 ? `de ${target}` : ""}</span>
                        {target > 0 && <span>{progress.toFixed(0)}%</span>}
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={cn(
                        "h-8 w-8 p-0 font-bold text-base hover:bg-primary hover:text-primary-foreground transition-all duration-200",
                        goalMet && "border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                      )}
                      onClick={() => handleIncrement(key)}
                      disabled={incrementActivity.isPending}
                    >
                      +
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator className="bg-primary/10" />

        {/* Sección 2: Resultados Comerciales */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Resultados del Día (Métricas Anónimas)
          </h4>
          <div className="space-y-3">
            {outcomeConfig.map(({ key, label, icon: Icon, color }) => {
              const target = getGoalTarget(key);
              const current = getCurrentValue(key);
              const progress = getProgress(key);
              const goalMet = isGoalMet(key);
              
              return (
                <div key={key} className={cn(
                  "bg-muted/30 rounded-lg p-3 border transition-all hover:bg-muted/40",
                  goalMet && "border-green-500/30 bg-green-500/5 hover:bg-green-500/10"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", color)} />
                      <span className="text-sm font-medium">{label}</span>
                      {goalMet && <PartyPopper className="h-4 w-4 text-yellow-500 animate-bounce" />}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {editingGoal === key ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={goalValues[key]}
                            onChange={(e) => handleGoalValueChange(key, e.target.value)}
                            className="h-7 w-16 text-sm bg-background border-primary/30"
                            placeholder="Meta"
                            min={0}
                            autoFocus
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 hover:bg-primary/20"
                            onClick={() => handleSaveGoal(key)}
                            disabled={setDailyGoal.isPending}
                          >
                            <Check className="h-3 w-3 text-primary" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="text-xs text-muted-foreground">
                            Meta: {target > 0 ? target : "—"}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 hover:bg-primary/10"
                            onClick={() => {
                              handleGoalValueChange(key, target.toString());
                              setEditingGoal(key);
                            }}
                          >
                            <Edit2 className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Progress 
                        value={progress} 
                        className={cn(
                          "h-2",
                          goalMet && "[&>div]:bg-green-500"
                        )} 
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{current} {target > 0 ? `de ${target}` : ""}</span>
                        {target > 0 && <span>{progress.toFixed(0)}%</span>}
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={cn(
                        "h-8 w-8 p-0 font-bold text-base hover:bg-primary hover:text-primary-foreground transition-all duration-200",
                        goalMet && "border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                      )}
                      onClick={() => handleIncrement(key)}
                      disabled={incrementActivity.isPending}
                    >
                      +
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Fila Especial: Ingresos Generados ($) */}
            <div className="bg-muted/30 rounded-lg p-3 border transition-all hover:bg-muted/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium">Ingresos Generados</span>
              </div>
              
              <div className="flex items-center gap-1">
                {isEditingRevenue ? (
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-emerald-400">$</span>
                    <Input
                      type="number"
                      value={revenueInput}
                      onChange={(e) => setRevenueInput(e.target.value)}
                      className="h-7 w-20 text-sm bg-background border-emerald-500/30 text-emerald-500"
                      placeholder="Valor"
                      min={0}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveRevenue();
                      }}
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 hover:bg-emerald-500/20"
                      onClick={handleSaveRevenue}
                      disabled={updateActivityValue.isPending}
                    >
                      <Check className="h-3 w-3 text-emerald-500" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-emerald-500">
                      ${parseFloat(revenueInput || "0").toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 hover:bg-primary/10"
                      onClick={() => setIsEditingRevenue(true)}
                    >
                      <Edit2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
