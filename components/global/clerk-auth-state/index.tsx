"use client";

import { User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {};

function ClerkAuthState({}: Props) {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    // Check if session cookie exists
    setLoggedIn(document.cookie.includes("user_session"));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/sign-in");
    router.refresh();
  };

  if (!loggedIn) {
    return (
      <Link href="/sign-in" className="flex items-center gap-x-3 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-magenta)] transition-smooth">
        <User size={16} />
        <span>Login</span>
      </Link>
    );
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-x-3 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-magenta)] transition-smooth"
    >
      <LogOut size={16} />
      <span>Logout</span>
    </button>
  );
}

export default ClerkAuthState;
