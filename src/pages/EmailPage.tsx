
import { Mail } from "lucide-react";
import { ChannelPage } from "@/components/channels/ChannelPage";
import { mockLeads } from "@/utils/mock-data";

const EmailPage = () => {
  const emailLeads = mockLeads.filter(lead => lead.channel === "email").length;
  const trend = { value: Math.floor(Math.random() * 20) - 5, isPositive: Math.random() > 0.5 };
  
  return (
    <ChannelPage
      channel="email"
      title="Email"
      description="Seguimiento de leads adquiridos a través de correo electrónico"
      icon={<Mail className="h-5 w-5 text-email" />}
      count={emailLeads}
      trend={trend}
    />
  );
};

export default EmailPage;
