
import { Mail } from "lucide-react";
import { ChannelPage } from "@/components/channels/ChannelPage";

const EmailPage = () => {
  return (
    <ChannelPage
      channel="email"
      title="Email"
      description="Seguimiento de leads adquiridos a través de correo electrónico"
      icon={<Mail className="h-5 w-5 text-email" />}
    />
  );
};

export default EmailPage;
