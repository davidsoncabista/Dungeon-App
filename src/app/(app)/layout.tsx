
"use client"

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from 'next/navigation';
import { AppHeader } from "@/app/(app)/header";
import { auth, app } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollectionData } from "react-firebase-hooks/firestore";
import { collection, getFirestore, query, where, orderBy, doc, updateDoc, arrayUnion } from "firebase/firestore";
import type { User } from "@/lib/types/user";
import type { Notice } from "@/lib/types/notice";
import { WelcomeModal } from "@/components/app/welcome-modal";
import { NoticeModal } from "@/components/app/notice-modal";

const adminRoutes: Record<string, string[]> = {
    'Administrador': ['/admin/system', '/admin/finance', '/admin/messages', '/admin/access-rules', '/admin/rooms', '/statistics', '/users'],
    'Editor': ['/admin/rooms', '/statistics', '/users'],
    'Revisor': ['/statistics', '/users'],
    'Membro': [],
    'Visitante': [],
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

    const publicLoggedInRoutes = ["/profile", "/billing", "/my-bookings", "/messages", "/notices"];
    
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

  const [currentUserData, userLoading, userError] = useCollectionData<User>(
    user && user.uid ? query(collection(firestore, 'users'), where('uid', '==', user.uid)) : null
  );
  
  const currentUser = currentUserData?.[0];
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  
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
    // 1. Espera o carregamento inicial da autenticação
    if (authLoading) {
      return;
    }
    
    // 2. Se não houver usuário autenticado, redireciona para o login
    if (!user) {
        router.replace('/login');
        return;
    }

    // 3. Se o usuário está autenticado mas os dados do Firestore ainda estão carregando, espere.
    if (userLoading) {
        return;
    }

    // 4. Agora temos certeza que `user` existe e `userLoading` terminou.
    // Se `currentUser` não foi encontrado, pode ser um erro ou um usuário recém-criado.
    // Por segurança, não fazemos nada até que `currentUser` esteja disponível.
    if (!currentUser) {
        // Você pode adicionar um log aqui para depuração, se necessário.
        return;
    }

    // 5. Com `currentUser` disponível, podemos verificar o acesso com segurança.
    const access = checkAccess(pathname, currentUser);
    if (!access.allowed && access.redirect) {
        router.replace(access.redirect);
        return; // Para a execução para evitar abrir o modal de boas-vindas desnecessariamente
    }

    // 6. Lógica do modal de boas-vindas
    const hasSeenWelcome = localStorage.getItem(`welcome_${user.uid}`);
    if (!hasSeenWelcome && (currentUser.status === 'Pendente' || currentUser.category === 'Visitante')) {
        setIsWelcomeModalOpen(true);
    }

  }, [user, currentUser, authLoading, userLoading, pathname, router]);

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
  
  // Exibe o loader enquanto a autenticação ou os dados do usuário estiverem carregando.
  if (authLoading || (user && userLoading)) {
    return <FullPageLoader />;
  }
  
  // Se o usuário não estiver autenticado (e não estiver carregando), o useEffect já terá redirecionado.
  // Renderizar null evita um flash de conteúdo antes do redirecionamento.
  if (!user) {
    return null;
  }
  
  // Se o usuário está autenticado mas o `currentUser` ainda não carregou, continue mostrando o loader.
  if (!currentUser) {
      return <FullPageLoader />;
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
