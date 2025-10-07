"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Componente de redirecionamento
export default function RedirectToAmazegame() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/amazegame');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className='text-center'>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className='mt-4 text-lg text-muted-foreground'>Redirecionando para a nova página do Maze Tracker...</p>
        </div>
    </div>
  );
}
