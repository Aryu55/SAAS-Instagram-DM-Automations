import { InstagramDuoToneBlue } from "@/icons";

type Props = {
  title: string;
  icon: React.ReactNode;
  description: string;
  strategy: "INSTAGRAM" | "CRM";
};

export const INTEGRATION_CARDS: Props[] = [
  {
    title: "Connect Instagram",
    description:
      "Connect your Instagram business account to automate comments, replies and direct messages.",
    icon: <InstagramDuoToneBlue />,
    strategy: "INSTAGRAM",
  },
];

