
"use client"

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from 'next/navigation';
import { AppHeader } from "@/components/app/header";
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollectionData } from "react-firebase-hooks/firestore";
import { collection, getFirestore, query, where } from "firebase/firestore";
import type { User } from "@/lib/types/user";

// Rotas de administração, ordenadas da mais restrita para a menos.
const adminOnlyRoutes = ["/admin"];
const editorRoutes = ["/rooms", "/statistics", "/users"];
const revisorRoutes = ["/statistics", "/users", "/rooms", "/admin"]; // Revisores podem ver tudo
const allAdminRoutes = [...new Set([...adminOnlyRoutes, ...editorRoutes, ...revisorRoutes])];

// Rotas principais para membros ativos.
const memberRoutes = ["/online-schedule", "/my-bookings", "/billing", "/profile", "/notices"];

// Rotas permitidas para usuários que ainda não se matricularam (Visitantes).
const visitorRoutes = ["/billing", "/profile", "/my-bookings"];

export default function AppLayout({ children }: { children: ReactNode }) {
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();
  const pathname = usePathname();

  const [appUser, userLoading, userError] = useCollectionData<User>(
    user ? query(collection(getFirestore(), 'users'), where('uid', '==', user.uid)) as any : null
  );
  
  const currentUser = appUser?.[0];

  useEffect(() => {
    // Se o usuário não está logado, manda para a página de login.
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    // Se os dados do usuário carregaram
    if (user && currentUser && !userLoading) {
        
        // REGRA 1: CADASTRO INCOMPLETO (Status 'Pendente')
        // O usuário fica "preso" na página de perfil até completá-lo.
        if (currentUser.status === 'Pendente' && pathname !== '/profile') {
            router.push('/profile');
            return;
        }

        // REGRA 2: MATRÍCULA PENDENTE (Categoria 'Visitante')
        // Se o cadastro está completo mas ele ainda é 'Visitante',
        // ele só pode acessar as rotas de visitante.
        if (currentUser.category === 'Visitante' && !visitorRoutes.includes(pathname)) {
            router.push('/billing');
            return;
        }
        
        // REGRA 3: CONTROLE DE ACESSO DE MEMBRO COMUM
        // Bloqueia o acesso a qualquer rota de administração.
        if (currentUser.role === 'Membro' && allAdminRoutes.some(p => pathname.startsWith(p))) {
            router.push('/online-schedule');
            return;
        }
    }
  }, [user, loading, userLoading, currentUser, pathname, router]);


  if (loading || userLoading || (user && !currentUser)) {
    return (
        <div className="flex flex-col min-h-screen w-full bg-muted/40">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
                 <Skeleton className="h-8 w-32" />
                 <Skeleton className="h-8 w-24 ml-4" />
                 <Skeleton className="h-8 w-32" />
                 <div className="ml-auto flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                 </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
               <Skeleton className="h-96 w-full" />
            </main>
        </div>
    );
  }

  if (error || userError) {
    // Idealmente, aqui teríamos uma página de erro mais elaborada
    return <div>Error: {error?.message || userError?.message}</div>;
  }
  
  // Se não há usuário logado, mas ainda está carregando, não renderiza nada para evitar piscar.
  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AppHeader user={user} currentUserData={currentUser} />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
