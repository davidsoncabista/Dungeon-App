import type { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/sidebar";
import { AppHeader } from "@/components/app/header";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
       <div className="flex min-h-screen w-full flex-col bg-muted/40">
          <AppSidebar />
          {/* Alterado sm:pl-14 para sm:pl-64 para dar espaço para a sidebar expandida */}
          <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64">
            <AppHeader />
            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
              {children}
            </main>
          </div>
        </div>
    </SidebarProvider>
  );
}
