
"use client"

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from 'next/navigation';
import { AppHeader } from "@/app/(app)/header";
import { auth, app } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollectionData } from "react-firebase-hooks/firestore";
import { collection, getFirestore, query, where, orderBy, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import type { User } from "@/lib/types/user";
import type { Notice } from "@/lib/types/notice";
import { WelcomeModal } from "@/components/app/welcome-modal";
import { NoticeModal } from "@/components/app/notice-modal";
import { createAuditLog } from "@/lib/auditLogger";
import { useIdleTimeout } from "@/hooks/use-idle-timeout";
import { IdleTimeoutModal } from "@/components/app/idle-timeout-modal";

const adminRoutes: Record<string, string[]> = {
    'Administrador': ['/admin/system', '/admin/finance', '/admin/messages', '/admin/access-rules', '/admin/landing-editor', '/admin/rooms', '/statistics', '/users', '/admin'],
    'Editor': ['/admin/rooms', '/statistics', '/users', '/admin'],
    'Revisor': ['/statistics', '/users', '/admin'],
    'Membro': [],
    'Visitante': [],
    'Convidado': [],
};

const getAccessibleRoutes = (role: User['role']): string[] => {
    if (!role) return [];
    return adminRoutes[role] || [];
};

const checkAccess = (pathname: string, user: User | null): { allowed: boolean, redirect: string | null } => {
    if (!user) {
        return { allowed: false, redirect: '/login' };
    }

    const { status, category, role } = user;

    // REGRA 1: CADASTRO INCOMPLETO
    if (status === 'Pendente' && pathname !== '/profile') {
        return { allowed: false, redirect: '/profile' };
    }

    const publicLoggedInRoutes = ["/profile", "/billing", "/my-bookings", "/messages", "/notices", "/books"];
    
    // REGRA 2: MATRÍCULA PENDENTE (VISITANTE)
    if (category === 'Visitante' && !publicLoggedInRoutes.includes(pathname)) {
        return { allowed: false, redirect: '/billing' };
    }

    // REGRA 3: USUÁRIO NÃO-ATIVO (Pendente de pagamento ou Bloqueado)
    if (status !== 'Ativo' && category !== 'Visitante' && !publicLoggedInRoutes.includes(pathname)) {
        return { allowed: false, redirect: '/billing' };
    }
    
    // REGRA 4: ACESSO ADMIN
    const isAdminRoute = pathname.startsWith('/admin') || ['/statistics', '/users', '/rooms'].includes(pathname);
    if (isAdminRoute) {
        const accessibleAdminRoutes = getAccessibleRoutes(role);
        const hasAccess = accessibleAdminRoutes.some(route => pathname.startsWith(route));
        if (!hasAccess) {
          return { allowed: false, redirect: '/online-schedule' };
        }
    }

    return { allowed: true, redirect: null };
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const [user, authLoading, authError] = useAuthState(auth);
  const router = useRouter();
  const pathname = usePathname();
  const firestore = getFirestore(app);
  const functions = getFunctions(app, 'southamerica-east1');


  const [currentUserData, userLoading, userError] = useCollectionData<User>(
    user && user.uid ? query(collection(firestore, 'users'), where('uid', '==', user.uid)) : null
  );
  
  const currentUser = currentUserData?.[0];
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  
  // --- Lógica de Timeout por Inatividade ---
  const { isIdle, reset: resetIdleTimer } = useIdleTimeout(900000, 60000); // 15 min timeout, 1 min warning


  // --- Lógica de Avisos ---
  const noticesRef = collection(firestore, 'notices');
  const noticesQuery = query(noticesRef, orderBy("createdAt", "desc"));
  const [notices] = useCollectionData<Notice>(noticesQuery, { idField: 'id' });
  const [showNotice, setShowNotice] = useState(false);
  
  const lastNotice = notices?.[0];

  useEffect(() => {
    if (user && lastNotice && !lastNotice.readBy?.includes(user.uid)) {
      setShowNotice(true);
    } else {
      setShowNotice(false);
    }
  }, [user, lastNotice]);

  const handleDismissNotice = async (noticeId: string) => {
    if (!user) return;
    const noticeRef = doc(firestore, 'notices', noticeId);
    try {
      await updateDoc(noticeRef, { readBy: arrayUnion(user.uid) });
    } catch (error) {
      console.error("Erro ao marcar aviso como lido:", error);
    }
    setShowNotice(false);
  };

  useEffect(() => {
    const processLogin = async (user: any) => {
      // Sincroniza os claims primeiro
      try {
          const syncUserClaims = httpsCallable(functions, 'syncUserClaims');
          await syncUserClaims();
          console.log("[Auth] Claims sincronizados com sucesso.");

          // Força a atualização do token
          await user.getIdToken(true);
          console.log("[Auth] Token do usuário atualizado no cliente.");

      } catch (error) {
          console.error("[Auth] Falha ao sincronizar claims ou atualizar token:", error);
      }

      if (userLoading) return; // Aguarda os dados do Firestore
      if (!currentUser) return; // Aguarda os dados do Firestore

      // --- Lógica de redirecionamento e modais ---
      const access = checkAccess(pathname, currentUser);
      if (!access.allowed && access.redirect) {
          router.replace(access.redirect);
          return;
      }
      
      const hasSeenWelcome = localStorage.getItem(`welcome_${user.uid}`);
      if (!hasSeenWelcome && (currentUser.status === 'Pendente' || currentUser.category === 'Visitante')) {
          setIsWelcomeModalOpen(true);
      }
      
      // --- Log de Login ---
      const sessionLoginKey = `login_${user.uid}_${sessionStorage.getItem('session_id')}`;
      if (!sessionStorage.getItem(sessionLoginKey)) {
          createAuditLog(currentUser, 'USER_LOGIN');
          sessionStorage.setItem(sessionLoginKey, 'true');
      }
    };

    if (authLoading) return;
    
    if (user) {
        processLogin(user);
    } else {
        router.replace('/login');
    }

  }, [user, currentUser, authLoading, userLoading, pathname, router, functions]);

   // Gerencia um ID de sessão para a aba do navegador
    useEffect(() => {
        if (!sessionStorage.getItem('session_id')) {
            sessionStorage.setItem('session_id', new Date().getTime().toString());
        }
    }, []);


  const handleCloseWelcomeModal = () => {
    setIsWelcomeModalOpen(false);
    if (user) {
        localStorage.setItem(`welcome_${user.uid}`, 'true');
    }
  };


  const FullPageLoader = () => (
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

  if (authError || userError) {
    return <div>Error: {authError?.message || userError?.message}</div>;
  }
  
  if (authLoading || (user && userLoading)) {
    return <FullPageLoader />;
  }
  
  if (!user) {
    return null;
  }
  
  if (!currentUser) {
      return <FullPageLoader />;
  }


  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <IdleTimeoutModal
        isOpen={isIdle}
        onStay={() => resetIdleTimer()}
        countdown={60}
      />
      {currentUser && (
        <WelcomeModal 
            isOpen={isWelcomeModalOpen}
            onClose={handleCloseWelcomeModal}
            userName={currentUser.name}
            userStatus={currentUser.status}
            userCategory={currentUser.category}
        />
      )}
       {showNotice && lastNotice && (
        <NoticeModal notice={lastNotice} onDismiss={handleDismissNotice} />
      )}
      <AppHeader user={user} currentUserData={currentUser} />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
