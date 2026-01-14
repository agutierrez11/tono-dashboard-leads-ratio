
import { Linkedin } from "lucide-react";
import { ChannelPage } from "@/components/channels/ChannelPage";
import { mockLeads } from "@/utils/mock-data";

const LinkedinPage = () => {
  const linkedinLeads = mockLeads.filter(lead => lead.channel === "linkedin").length;
  const trend = { value: Math.floor(Math.random() * 30) + 5, isPositive: true };
  
  return (
    <ChannelPage
      channel="linkedin"
      title="LinkedIn"
      description="Seguimiento de leads adquiridos a través de LinkedIn"
      icon={<Linkedin className="h-5 w-5 text-linkedin" />}
      count={linkedinLeads}
      trend={trend}
    />
  );
};

export default LinkedinPage;
