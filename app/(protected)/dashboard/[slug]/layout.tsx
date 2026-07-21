import NavBar from "@/components/global/navbar";
import Sidebar from "@/components/global/sidebar";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Janus AI | Mindmaxing",
  description: "Content Marketing Command Center",
};

type Props = {
  children: React.ReactNode;
  params: {
    slug: string;
  };
};

async function Layout({ children, params }: Props) {
  return (
    <div className="flex min-h-screen w-full bg-background radial--gradient">
      <Sidebar slug={params.slug} />
      <div className="flex-1 lg:ml-[250px] p-6 lg:p-8 flex flex-col overflow-x-hidden min-h-screen">
        <NavBar slug={params.slug} />
        <main className="flex-grow mt-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
