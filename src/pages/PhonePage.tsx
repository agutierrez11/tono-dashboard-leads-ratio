
import { Phone } from "lucide-react";
import { ChannelPage } from "@/components/channels/ChannelPage";
import { mockLeads } from "@/utils/mock-data";

const PhonePage = () => {
  const phoneLeads = mockLeads.filter(lead => lead.channel === "phone").length;
  const trend = { value: Math.floor(Math.random() * 15) + 2, isPositive: true };
  
  return (
    <ChannelPage
      channel="phone"
      title="Teléfono"
      description="Seguimiento de leads adquiridos a través de llamadas telefónicas"
      icon={<Phone className="h-5 w-5 text-phone" />}
      count={phoneLeads}
      trend={trend}
    />
  );
};

export default PhonePage;
