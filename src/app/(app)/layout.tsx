
"use client"

import type { ReactNode } from "react";
import { usePathname, useRouter, redirect } from 'next/navigation';
import { AppHeader } from "@/components/app/header";
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { getAuthenticatedUser } from "@/lib/mock-service"; // MOCK

export default function AppLayout({ children }: { children: ReactNode }) {
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();
  const pathname = usePathname();

  // MOCK: Simula a busca dos dados completos do usuário
  const appUser = getAuthenticatedUser(); 

  if (loading) {
    return (
        <div className="flex flex-col min-h-screen w-full bg-muted/40">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
                 <Skeleton className="h-8 w-32" />
                 <Skeleton className="h-8 w-24 ml-4" />
                 <Skeleton className="h-8 w-32" />
                 <div className="ml-auto flex items-center gap-4">
                    <Skeleton className="h-10 w-[300px]" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                 </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
               <Skeleton className="h-96 w-full" />
            </main>
        </div>
    );
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }
  
  if (!user) {
    redirect('/login');
    return null;
  }

  // Lógica de redirecionamento para novos usuários
  if (appUser.category === 'Visitante' && pathname !== '/subscribe') {
      redirect('/subscribe');
      return null;
  }

  // Impede que visitantes acessem outras páginas além de /subscribe e /profile
  if (appUser.category === 'Visitante' && pathname !== '/subscribe' && pathname !== '/profile') {
      redirect('/subscribe');
      return null;
  }
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
