
import { Linkedin } from "lucide-react";
import { ChannelPage } from "@/components/channels/ChannelPage";

const LinkedinPage = () => {
  return (
    <ChannelPage
      channel="linkedin"
      title="LinkedIn"
      description="Seguimiento de leads adquiridos a través de LinkedIn"
      icon={<Linkedin className="h-5 w-5 text-linkedin" />}
    />
  );
};

export default LinkedinPage;
