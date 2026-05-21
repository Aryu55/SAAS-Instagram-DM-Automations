import { v4 } from "uuid";

type Props = {
  id: string;
  label: string;
  subLabel: string;
  description: string;
};

export const DASHBOARD_CARDS: Props[] = [
  {
    id: v4(),
    label: "Set-up Auto Replies",
    subLabel: "Deliver custom responses through Instagram DM",
    description: "Create keyword-triggered messages to engage your followers instantly.",
  },
  {
    id: v4(),
    label: "Answer Questions with AI",
    subLabel: "Identify and respond to queries with Smart AI",
    description: "Let ChatGPT handle common customer service and product questions.",
  },
  {
    id: v4(),
    label: "Connect Integrations",
    subLabel: "Manage Facebook & Instagram connections",
    description: "Check connection status, renew tokens, or link new accounts.",
  },
];
