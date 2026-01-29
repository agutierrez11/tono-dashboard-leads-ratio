import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CalendarDays, 
  Phone, 
  PhoneCall, 
  Mail, 
  Linkedin,
  TrendingUp
} from "lucide-react";
import { useMonthlyActivities, DailyActivity } from "@/hooks/useActivities";

export const ActivityHistory = () => {
  const { data: monthlyActivities = [] } = useMonthlyActivities();

  // Calculate totals
  const calculateTotals = (activities: DailyActivity[]) => ({
    calls_made: activities.reduce((acc, day) => acc + day.calls_made, 0),
    calls_connected: activities.reduce((acc, day) => acc + day.calls_connected, 0),
    emails_sent: activities.reduce((acc, day) => acc + day.emails_sent, 0),
    linkedin_contacts: activities.reduce((acc, day) => acc + day.linkedin_contacts, 0),
  });

  // Get this week's activities (last 7 days)
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const weeklyActivities = monthlyActivities.filter(a => {
    const date = new Date(a.activity_date);
    return date >= weekAgo && date <= today;
  });

  const monthlyTotals = calculateTotals(monthlyActivities);
  const weeklyTotals = calculateTotals(weeklyActivities);

  // Get the last 7 days with activity
  const recentDays = monthlyActivities
    .sort((a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime())
    .slice(0, 7);

  const StatRow = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) => (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-bold">{value}</span>
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Historial de Actividades
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="week" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="daily">Días</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily" className="space-y-2">
            {recentDays.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin actividades registradas
              </p>
            ) : (
              recentDays.map((day) => {
                const date = new Date(day.activity_date);
                const isToday = day.activity_date === today.toISOString().split("T")[0];
                const dayName = isToday ? "Hoy" : date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
                const total = day.calls_made + day.calls_connected + day.emails_sent + day.linkedin_contacts;
                
                return (
                  <div key={day.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{dayName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-orange-500" />
                        {day.calls_made}
                      </span>
                      <span className="flex items-center gap-1">
                        <PhoneCall className="h-3 w-3 text-green-500" />
                        {day.calls_connected}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-blue-500" />
                        {day.emails_sent}
                      </span>
                      <span className="flex items-center gap-1">
                        <Linkedin className="h-3 w-3 text-[#0077B5]" />
                        {day.linkedin_contacts}
                      </span>
                      <span className="font-bold text-primary">= {total}</span>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>
          
          <TabsContent value="week">
            <div className="space-y-1">
              <StatRow icon={Phone} label="Llamadas realizadas" value={weeklyTotals.calls_made} color="text-orange-500" />
              <StatRow icon={PhoneCall} label="Llamadas conectadas" value={weeklyTotals.calls_connected} color="text-green-500" />
              <StatRow icon={Mail} label="Emails enviados" value={weeklyTotals.emails_sent} color="text-blue-500" />
              <StatRow icon={Linkedin} label="Contactos LinkedIn" value={weeklyTotals.linkedin_contacts} color="text-[#0077B5]" />
            </div>
            <div className="mt-3 pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total acciones (7 días)</span>
                <span className="text-xl font-bold text-primary">
                  {weeklyTotals.calls_made + weeklyTotals.calls_connected + weeklyTotals.emails_sent + weeklyTotals.linkedin_contacts}
                </span>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="month">
            <div className="space-y-1">
              <StatRow icon={Phone} label="Llamadas realizadas" value={monthlyTotals.calls_made} color="text-orange-500" />
              <StatRow icon={PhoneCall} label="Llamadas conectadas" value={monthlyTotals.calls_connected} color="text-green-500" />
              <StatRow icon={Mail} label="Emails enviados" value={monthlyTotals.emails_sent} color="text-blue-500" />
              <StatRow icon={Linkedin} label="Contactos LinkedIn" value={monthlyTotals.linkedin_contacts} color="text-[#0077B5]" />
            </div>
            <div className="mt-3 pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total acciones (mes)</span>
                <span className="text-xl font-bold text-primary">
                  {monthlyTotals.calls_made + monthlyTotals.calls_connected + monthlyTotals.emails_sent + monthlyTotals.linkedin_contacts}
                </span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
