
"use client"

import type { ReactNode } from "react";
import { AppHeader } from "@/components/app/header";
import { redirect } from 'next/navigation';
<<<<<<< HEAD
// import { getAuth } from "firebase/auth";
// import { app } from "@/lib/firebase";

export default function AppLayout({ children }: { children: ReactNode }) {
  // const auth = getAuth(app);
  // const user = auth.currentUser;

=======
// import { getAuthenticatedUser } from "@/lib/mock-service";

export default function AppLayout({ children }: { children: ReactNode }) {
  // Simula a verificação de autenticação - TEMPORARIAMENTE DESABILITADO
  // const user = getAuthenticatedUser(); 
>>>>>>> adfb7d2 (File changes)
  // if (!user) {
  //   redirect('/login');
  // }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
