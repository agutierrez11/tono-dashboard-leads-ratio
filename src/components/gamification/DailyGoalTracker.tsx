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
  Edit2,
  Check,
  RotateCcw,
  PartyPopper
} from "lucide-react";
import { useTodayActivities, useIncrementActivity } from "@/hooks/useActivities";
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
  { key: "calls_made" as ActivityType, label: "Llamadas", icon: Phone, color: "text-orange-500", bgColor: "bg-orange-500" },
  { key: "calls_connected" as ActivityType, label: "Conectadas", icon: PhoneCall, color: "text-green-500", bgColor: "bg-green-500" },
  { key: "emails_sent" as ActivityType, label: "Emails", icon: Mail, color: "text-blue-500", bgColor: "bg-blue-500" },
  { key: "linkedin_contacts" as ActivityType, label: "LinkedIn", icon: Linkedin, color: "text-[#0077B5]", bgColor: "bg-[#0077B5]" },
];

export const DailyGoalTracker = () => {
  const { data: todayActivities } = useTodayActivities();
  const { data: dailyGoals = [] } = useDailyGoals();
  const incrementActivity = useIncrementActivity();
  const setDailyGoal = useSetDailyGoal();
  const resetActivities = useResetTodayActivities();
  
  const [editingGoal, setEditingGoal] = useState<ActivityType | null>(null);
  const [goalValue, setGoalValue] = useState("");

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
    const value = parseInt(goalValue);
    if (value > 0) {
      setDailyGoal.mutate({ goalType, targetValue: value });
      setEditingGoal(null);
      setGoalValue("");
    }
  };

  const handleIncrement = (type: ActivityType) => {
    incrementActivity.mutate({ activityType: type });
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Metas Diarias de Actividad
          </CardTitle>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1">
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Reiniciar</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Reiniciar contadores?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esto pondrá todos los contadores de hoy en cero. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => resetActivities.mutate()}
                  className="bg-destructive text-destructive-foreground"
                >
                  Reiniciar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activityConfig.map(({ key, label, icon: Icon, color, bgColor }) => {
          const target = getGoalTarget(key);
          const current = getCurrentValue(key);
          const progress = getProgress(key);
          const goalMet = isGoalMet(key);
          
          return (
            <div key={key} className={cn(
              "bg-card rounded-lg p-3 border transition-all",
              goalMet && "border-green-500/50 bg-green-500/5"
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
                        value={goalValue}
                        onChange={(e) => setGoalValue(e.target.value)}
                        className="h-7 w-16 text-sm"
                        placeholder="Meta"
                        min={1}
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2"
                        onClick={() => handleSaveGoal(key)}
                        disabled={setDailyGoal.isPending}
                      >
                        <Check className="h-3 w-3" />
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
                        className="h-7 px-2"
                        onClick={() => {
                          setGoalValue(target.toString());
                          setEditingGoal(key);
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
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
                      "h-3",
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
                    "h-10 w-10 p-0 font-bold text-lg",
                    goalMet && "border-green-500 text-green-500"
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
      </CardContent>
    </Card>
  );
};
