
"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona imediatamente para a primeira sub-página padrão.
    router.replace('/admin/system');
  }, [router]);

  return null; // A página em si não precisa renderizar nada.
}
