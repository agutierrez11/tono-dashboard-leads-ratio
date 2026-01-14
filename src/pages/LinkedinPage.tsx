
import { Linkedin } from "lucide-react";
import { ChannelPage } from "@/components/channels/ChannelPage";
import { useLeadStats } from "@/hooks/useLeads";

const LinkedinPage = () => {
  const { stats } = useLeadStats();
  const linkedinLeads = stats.byChannel.linkedin;
  
  return (
    <ChannelPage
      channel="linkedin"
      title="LinkedIn"
      description="Seguimiento de leads adquiridos a través de LinkedIn"
      icon={<Linkedin className="h-5 w-5 text-linkedin" />}
      count={linkedinLeads}
      trend={{ value: 0, isPositive: true }}
    />
  );
};

export default LinkedinPage;
