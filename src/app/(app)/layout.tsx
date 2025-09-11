
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
const memberRoutes = ["/dashboard", "/my-bookings", "/notices", "/profile", "/subscribe"];
const visitorRoutes = ["/subscribe", "/profile", "/my-bookings"];


export default function AppLayout({ children }: { children: ReactNode }) {
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();
  const pathname = usePathname();

  const [appUser, userLoading, userError] = useCollectionData<User>(
    user ? query(collection(getFirestore(), 'users'), where('uid', '==', user.uid)) as any : null
  );
  
  const currentUser = appUser?.[0];

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (!userLoading && currentUser) {
        // Regra 1: Forçar preenchimento do perfil para novos usuários
        // Se o status é Pendente (novo usuário) e ele não está na página de perfil, force-o para lá.
        if (currentUser.status === 'Pendente' && pathname !== '/profile') {
            router.push('/profile');
            return;
        }

        // Regra 2: Controle de Acesso para Visitantes
        // Se o status já não é mais pendente (perfil preenchido) mas a categoria é Visitante
        if (currentUser.status !== 'Pendente' && currentUser.category === 'Visitante') {
            if (!visitorRoutes.includes(pathname)) {
                router.push('/subscribe');
                return;
            }
        }
        
        // Regra 3: Controle de Acesso para Membros
        if (currentUser.role === 'Membro') {
            const allowedRoutes = [...memberRoutes, ...visitorRoutes];
            if (adminRoutes.some(p => pathname.startsWith(p))) {
                 router.push('/dashboard');
                 return;
            }
        }
        
        // Regra 4: Controle de acesso para Admin/Editor/Revisor
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
