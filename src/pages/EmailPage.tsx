
import { Mail } from "lucide-react";
import { ChannelPage } from "@/components/channels/ChannelPage";
import { useLeadStats } from "@/hooks/useLeads";

const EmailPage = () => {
  const { stats } = useLeadStats();
  const emailLeads = stats.byChannel.email;
  
  return (
    <ChannelPage
      channel="email"
      title="Email"
      description="Seguimiento de leads adquiridos a través de correo electrónico"
      icon={<Mail className="h-5 w-5 text-email" />}
      count={emailLeads}
      trend={{ value: 0, isPositive: true }}
    />
  );
};

export default EmailPage;
