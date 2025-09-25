
"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Esta página serve apenas como um redirecionador.
export default function AdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para a primeira página do menu de administração.
    router.replace('/admin/system');
  }, [router]);

  // Pode-se adicionar um loader aqui para melhorar a experiência do usuário.
  return null;
}
