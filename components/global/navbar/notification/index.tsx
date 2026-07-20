import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import React from "react";

type Props = {};

function Notification({}: Props) {
  return (
    <Button className="bg-[var(--card-bg)] border border-[var(--border-color)] hover:border-[var(--accent-magenta)]/30 rounded-xl py-6 transition-smooth">
      <Bell className="text-[var(--text-secondary)]" />
    </Button>
  );
}

export default Notification;
