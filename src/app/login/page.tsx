
"use client"

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Dices, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

// Ícone oficial do Google
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,34.551,44,29.861,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
);


export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [user, loading, error] = useAuthState(auth);
    const [isSigningIn, setIsSigningIn] = useState(false);

    useEffect(() => {
        if (!loading && user) {
            router.push('/online-schedule');
        }
    }, [user, loading, router]);


    const handleGoogleLogin = async () => {
        if (isSigningIn) return;
        setIsSigningIn(true);
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            toast({
                title: `Bem-vindo, ${user.displayName}!`,
                description: "Login realizado com sucesso. Redirecionando...",
            });
            // O useEffect cuidará do redirecionamento
        } catch (error: any) {
            if (error.code === 'auth/popup-closed-by-user') {
                console.log("Login cancelado pelo usuário.");
            } else {
                console.error("Erro na autenticação com Google:", error);
                toast({
                    title: "Erro no Login",
                    description: "Não foi possível autenticar com o Google. Tente novamente.",
                    variant: "destructive",
                });
            }
        } finally {
            setIsSigningIn(false);
        }
    };
    
    // Se estiver verificando o estado ou já logado, mostra um loader.
    if (loading || user) {
         return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Verificando sessão...</p>
            </div>
        );
    }


  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <main className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <Image 
                src="data:image/png;base64,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"
                width={162}
                height={170}
                alt="Logo da Associação Dungeon Belém"
                className="rounded-xl"
              />
            </div>
            <CardTitle className="font-headline text-4xl">Dungeon App</CardTitle>
            <CardDescription>Sistema de Reserva de Salas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                 <Button onClick={handleGoogleLogin} className="w-full py-6 text-lg font-bold" variant="outline" disabled={isSigningIn}>
                    {isSigningIn ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Autenticando...
                        </>
                    ) : (
                        <>
                            <GoogleIcon className="mr-4 h-6 w-6" />
                            Entrar com Google
                        </>
                    )}
                </Button>
                <div className="text-center">
                    <Button asChild variant="link">
                        <Link href="/landing">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar para a página inicial
                        </Link>
                    </Button>
                </div>
            </div>
             {error && (
                <p className="mt-4 text-center text-sm text-destructive">
                    Erro: {error.message}
                </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
