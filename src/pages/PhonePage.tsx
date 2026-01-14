
import { Phone } from "lucide-react";
import { ChannelPage } from "@/components/channels/ChannelPage";

const PhonePage = () => {
  return (
    <ChannelPage
      channel="phone"
      title="Teléfono"
      description="Seguimiento de leads adquiridos a través de llamadas telefónicas"
      icon={<Phone className="h-5 w-5 text-phone" />}
    />
  );
};

export default PhonePage;
