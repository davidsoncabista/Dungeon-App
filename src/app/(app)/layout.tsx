
"use client"

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from 'next/navigation';
import { AppHeader } from "@/components/app/header";
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollectionData } from "react-firebase-hooks/firestore";
import { collection, getFirestore, query, where } from "firebase/firestore";
import type { User } from "@/lib/types/user";
import { WelcomeModal } from "@/components/app/welcome-modal";

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
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);


  useEffect(() => {
    // Se o usuário não está logado, manda para a página de login.
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    // Se os dados do usuário carregaram
    if (user && currentUser && !userLoading) {
        
        // REGRA 1: EXIBIR MODAL DE BOAS-VINDAS
        // Verifica se o usuário já viu o modal e se ele é um novo usuário.
        const hasSeenWelcome = localStorage.getItem(`welcome_${user.uid}`);
        if (!hasSeenWelcome && (currentUser.status === 'Pendente' || currentUser.category === 'Visitante')) {
            setIsWelcomeModalOpen(true);
        }

        // REGRA 2: CADASTRO INCOMPLETO (Status 'Pendente')
        // O usuário fica "preso" na página de perfil até completá-lo.
        if (currentUser.status === 'Pendente' && pathname !== '/profile') {
            router.push('/profile');
            return;
        }

        // REGRA 3: MATRÍCULA PENDENTE (Categoria 'Visitante')
        // Se o cadastro está completo mas ele ainda é 'Visitante',
        // ele só pode acessar as rotas de visitante.
        if (currentUser.category === 'Visitante' && !visitorRoutes.includes(pathname)) {
            // Permite o acesso se o modal de boas-vindas estiver aberto para evitar redirecionamento durante o tutorial
            if (!isWelcomeModalOpen) {
                router.push('/billing');
            }
            return;
        }
        
        // REGRA 4: CONTROLE DE ACESSO DE MEMBRO COMUM
        // Bloqueia o acesso a qualquer rota de administração.
        if (currentUser.role === 'Membro' && allAdminRoutes.some(p => pathname.startsWith(p))) {
            router.push('/online-schedule');
            return;
        }
    }
  }, [user, loading, userLoading, currentUser, pathname, router, isWelcomeModalOpen]);

  const handleCloseWelcomeModal = () => {
    setIsWelcomeModalOpen(false);
    if (user) {
        localStorage.setItem(`welcome_${user.uid}`, 'true');
    }
  };


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
      {currentUser && (
        <WelcomeModal 
            isOpen={isWelcomeModalOpen}
            onClose={handleCloseWelcomeModal}
            userName={currentUser.name}
            userStatus={currentUser.status}
            userCategory={currentUser.category}
        />
      )}
      <AppHeader user={user} currentUserData={currentUser} />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
