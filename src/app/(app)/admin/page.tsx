
"use client"
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { auth, app } from "@/lib/firebase";
import { getFirestore, query, collection, where } from "firebase/firestore";
import type { User } from "@/lib/types/user";

export default function AdminRootPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, loadingAuth] = useAuthState(auth);
  const firestore = getFirestore(app);

  const userQuery = user ? query(collection(firestore, 'users'), where('uid', '==', user.uid)) : null;
  const [appUser, loadingUser] = useCollectionData<User>(userQuery);
  const currentUserRole = appUser?.[0]?.role;

  useEffect(() => {
    // Evita redirecionar se estivermos no meio do carregamento
    if (loadingAuth || loadingUser) return;
    
    // Apenas redireciona se o usuário for um Administrador.
    // Outros roles que chegam aqui são bloqueados pelo AppLayout.
    if (currentUserRole === 'Administrador' && pathname === '/admin') {
      router.replace('/admin/system');
    }
  }, [currentUserRole, loadingAuth, loadingUser, router, pathname]);

  return null; // Renderiza nada, a lógica está nos efeitos.
}
