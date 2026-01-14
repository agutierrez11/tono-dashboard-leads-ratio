
import { Phone } from "lucide-react";
import { ChannelPage } from "@/components/channels/ChannelPage";
import { useLeadStats } from "@/hooks/useLeads";

const PhonePage = () => {
  const { stats } = useLeadStats();
  const phoneLeads = stats.byChannel.phone;
  
  return (
    <ChannelPage
      channel="phone"
      title="Teléfono"
      description="Seguimiento de leads adquiridos a través de llamadas telefónicas"
      icon={<Phone className="h-5 w-5 text-phone" />}
      count={phoneLeads}
      trend={{ value: 0, isPositive: true }}
    />
  );
};

export default PhonePage;
