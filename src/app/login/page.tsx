
"use client"

import { useEffect, useState } from 'react';
import { Dices, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

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
<<<<<<< HEAD
            router.push('/online-schedule');
=======
            // O useEffect cuidará do redirecionamento
>>>>>>> 132f773a (feat: Adicionar funcionalidades e correções em diversas áreas do app)
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
              <Dices className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="font-headline text-4xl">Dungeon App</CardTitle>
            <CardDescription>Sistema de Reserva de Salas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
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
