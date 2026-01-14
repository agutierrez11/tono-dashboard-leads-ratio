
import { useState } from "react";
import { useChannelGoals, calculateGoalProgress } from "@/hooks/useGoals";
import { useLeads } from "@/hooks/useLeads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Plus, Trash2, Linkedin, Phone, Mail, TrendingUp, Users, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Channel, ChannelGoal } from "@/utils/types";

const channelIcons = {
  linkedin: Linkedin,
  phone: Phone,
  email: Mail,
};

const channelLabels = {
  linkedin: "LinkedIn",
  phone: "Teléfono",
  email: "Email",
};

const channelColors = {
  linkedin: 'text-linkedin',
  phone: 'text-phone',
  email: 'text-email',
};

const goalTypeIcons = {
  leads: Users,
  conversions: TrendingUp,
  revenue: DollarSign,
};

const goalTypeLabels = {
  leads: "Leads",
  conversions: "Conversiones",
  revenue: "Ingresos",
};

const periodLabels = {
  daily: "Diario",
  weekly: "Semanal",
  monthly: "Mensual",
};

export const GoalsManager = () => {
  const { goals, isLoading, addGoal, deleteGoal } = useChannelGoals();
  const { leads } = useLeads();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    channel: 'linkedin' as Channel,
    period: 'monthly' as ChannelGoal['period'],
    goal_type: 'leads' as ChannelGoal['goal_type'],
    target_value: 10,
  });

  const goalsWithProgress = calculateGoalProgress(goals, leads);
  const activeGoals = goalsWithProgress.filter(g => g.isActive);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (formData.period) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        const dayOfWeek = startDate.getDay();
        const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    try {
      await addGoal({
        channel: formData.channel,
        period: formData.period,
        goal_type: formData.goal_type,
        target_value: formData.target_value,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });
      setDialogOpen(false);
      setFormData({
        channel: 'linkedin',
        period: 'monthly',
        goal_type: 'leads',
        target_value: 10,
      });
    } catch (error) {
      console.error("Error adding goal:", error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Metas y Objetivos
          </span>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Nueva Meta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nueva Meta</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Canal</Label>
                  <Select
                    value={formData.channel}
                    onValueChange={(v) => setFormData({ ...formData, channel: v as Channel })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="phone">Teléfono</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Meta</Label>
                  <Select
                    value={formData.goal_type}
                    onValueChange={(v) => setFormData({ ...formData, goal_type: v as ChannelGoal['goal_type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leads">Nuevos Leads</SelectItem>
                      <SelectItem value="conversions">Conversiones</SelectItem>
                      <SelectItem value="revenue">Ingresos ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Periodo</Label>
                  <Select
                    value={formData.period}
                    onValueChange={(v) => setFormData({ ...formData, period: v as ChannelGoal['period'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diario</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Objetivo</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Crear Meta
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeGoals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No hay metas activas</p>
            <p className="text-sm">Crea una meta para empezar a medir tu progreso</p>
          </div>
        ) : (
          activeGoals.map((goal) => {
            const ChannelIcon = channelIcons[goal.channel];
            const GoalTypeIcon = goalTypeIcons[goal.goal_type];
            
            return (
              <div
                key={goal.id}
                className={cn(
                  "p-4 rounded-lg border",
                  goal.isCompleted ? "bg-green-50/50 border-green-200" : "bg-card"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded bg-muted", channelColors[goal.channel])}>
                      <ChannelIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm flex items-center gap-2">
                        {channelLabels[goal.channel]}
                        <Badge variant="outline" className="text-xs">
                          {periodLabels[goal.period]}
                        </Badge>
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <GoalTypeIcon className="h-3 w-3" />
                        {goalTypeLabels[goal.goal_type]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {goal.isCompleted && (
                      <Badge className="bg-green-500">Completada</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-medium">
                      {goal.goal_type === 'revenue' ? '$' : ''}{goal.currentValue} / {goal.goal_type === 'revenue' ? '$' : ''}{goal.target_value}
                    </span>
                  </div>
                  <Progress 
                    value={goal.progress} 
                    className={cn(
                      "h-2",
                      goal.isCompleted && "[&>div]:bg-green-500"
                    )}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {goal.progress}% completado
                  </p>
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(goal.start_date), "d MMM", { locale: es })} - {format(new Date(goal.end_date), "d MMM yyyy", { locale: es })}
                </p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
