
"use client"

import { Dices } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

// Adicione um ícone do Google. Pode ser um SVG ou um componente de ícone.
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-1.5c-1.38 0-1.5 1.62-1.5 1.5V12h3l-.5 3h-2.5v6.8c4.56-.93 8-4.96 8-9.8z"/>
    </svg>
);


export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            // O usuário foi autenticado com sucesso
            const user = result.user;
            toast({
                title: `Bem-vindo, ${user.displayName}!`,
                description: "Login realizado com sucesso.",
            });
            router.push('/dashboard');
        } catch (error: any) {
            console.error("Erro na autenticação com Google:", error);
            toast({
                title: "Erro no Login",
                description: "Não foi possível autenticar com o Google. Tente novamente.",
                variant: "destructive",
            });
        }
    };


  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <main className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <Dices className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="font-headline text-4xl">Dungeon App</CardTitle>
            <CardDescription>Sistema de Reserva de Salas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
                 <Button onClick={handleGoogleLogin} className="w-full py-6 text-lg font-bold" variant="outline">
                    <GoogleIcon className="mr-4 h-6 w-6" />
                    Entrar com Google
                </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
