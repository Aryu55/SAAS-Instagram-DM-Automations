import {
  AutomationDuoToneWhite,
  HomeDuoToneWhite,
  RocketDuoToneWhite,
  SettingsDuoToneWhite,
} from "@/icons";
import { Video, Users, Flame, BarChart3, Inbox, Factory, BookOpen, Eye, Brain } from "lucide-react";
import { v4 as uuid } from "uuid";

type Props = {
  label: string;
  id: string;
};

type SIDEBAR_MENU_TYPE = {
  icon: React.ReactNode;
  section?: string; // group label (ENGAGE, CREATE, LEARN)
} & Props;

export const SIDEBAR_MENU: SIDEBAR_MENU_TYPE[] = [
  // ── Overview ──
  {
    id: uuid(),
    label: "home",
    icon: <HomeDuoToneWhite />,
  },
  // ── ENGAGE ──
  {
    id: uuid(),
    label: "inbox",
    icon: <Inbox className="w-5 h-5 text-white" />,
    section: "ENGAGE",
  },
  {
    id: uuid(),
    label: "automation",
    icon: <AutomationDuoToneWhite />,
  },
  {
    id: uuid(),
    label: "contacts",
    icon: <Users className="w-5 h-5 text-white" />,
  },
  // ── CREATE ──
  {
    id: uuid(),
    label: "studio",
    icon: <Factory className="w-5 h-5 text-white" />,
    section: "CREATE",
  },
  {
    id: uuid(),
    label: "skills",
    icon: <BookOpen className="w-5 h-5 text-white" />,
  },
  {
    id: uuid(),
    label: "content-engine",
    icon: <Video className="w-5 h-5 text-white" />,
  },
  // ── LEARN ──
  {
    id: uuid(),
    label: "analytics",
    icon: <BarChart3 className="w-5 h-5 text-white" />,
    section: "LEARN",
  },
  {
    id: uuid(),
    label: "virality",
    icon: <Flame className="w-5 h-5 text-white" />,
  },
  {
    id: uuid(),
    label: "research",
    icon: <Eye className="w-5 h-5 text-white" />,
  },
  {
    id: uuid(),
    label: "intelligence",
    icon: <Brain className="w-5 h-5 text-white" />,
    section: "",
  },
  // ── System ──
  {
    id: uuid(),
    label: "integrations",
    icon: <RocketDuoToneWhite />,
    section: "",
  },
  {
    id: uuid(),
    label: "settings",
    icon: <SettingsDuoToneWhite />,
  },
];
