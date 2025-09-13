
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


const adminRoutes = ["/statistics", "/users", "/rooms", "/admin"];
const editorRoutes = ["/statistics", "/users", "/rooms"];
const memberRoutes = ["/online-schedule", "/my-bookings", "/notices", "/profile", "/subscribe"];
// Rotas que um visitante (perfil preenchido, mas sem plano) pode acessar.
const visitorRoutes = ["/online-schedule", "/subscribe", "/profile", "/my-bookings"];


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
    if (!userLoading && currentUser) {
        // REGRA 1: CADASTRO INCOMPLETO
        // Se o status é 'Pendente', o usuário está "preso" na página de perfil até completá-lo.
        if (currentUser.status === 'Pendente' && pathname !== '/profile') {
            router.push('/profile');
            return;
        }

        // REGRA 2: MATRÍCULA PENDENTE
        // Se o cadastro está completo (status 'Ativo') mas ele ainda é 'Visitante' (não escolheu um plano),
        // ele fica "preso" na página de matrícula, mas pode ver o dashboard e suas reservas.
        if (currentUser.status === 'Ativo' && currentUser.category === 'Visitante') {
            // Permite acesso apenas às rotas definidas para visitantes.
            if (!visitorRoutes.includes(pathname)) {
                router.push('/subscribe');
                return;
            }
        }
        
        // REGRA 3: CONTROLE DE ACESSO DE MEMBRO
        // Se é um membro comum, bloqueia o acesso às rotas de admin.
        if (currentUser.role === 'Membro') {
            if (adminRoutes.some(p => pathname.startsWith(p))) {
                 router.push('/dashboard');
                 return;
            }
        }
        
        // REGRA 4: CONTROLE DE ACESSO DE ADMIN/EDITOR/REVISOR
        // Se for Editor ou Revisor, bloqueia o acesso à página /admin.
        if (currentUser.role === 'Editor' || currentUser.role === 'Revisor') {
             if (pathname === '/admin') {
                router.push('/dashboard');
                return;
            }
        }
    }
  }, [user, loading, userLoading, currentUser, pathname, router]);


  if (loading || userLoading || !user) {
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

  if (error || userError) {
    // Idealmente, aqui teríamos uma página de erro mais elaborada
    return <div>Error: {error?.message || userError?.message}</div>;
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
