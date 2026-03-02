"use client"

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithRedirect, signInWithEmailAndPassword } from 'firebase/auth';
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
            await signInWithRedirect(auth, provider);
            // The page will redirect, so we don't need to handle the result here.
            // The useAuthState hook will pick up the user on the next page load.
        } catch (error: any) {
            console.error("Erro na autenticação com Google:", error);
            toast({
                title: "Erro no Login",
                description: "Não foi possível iniciar a autenticação com o Google. Tente novamente.",
                variant: "destructive",
            });
            setIsSigningIn(false); // Only set to false on error before redirect
        }
    };
    
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleEmailLogin = async () => {
        if (isSigningIn) return;
        setIsSigningIn(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // on success the auth state hook will redirect; additionally push
            router.push('/online-schedule');
        } catch (err: any) {
            console.error('Erro no login por email:', err);
            toast({
                title: 'Erro no Login',
                description: err?.message || 'Não foi possível efetuar login. Verifique seu email e senha.',
                variant: 'destructive',
            });
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
                src="/logo.svg" 
                width={80}
                height={80}
                alt="Logo da Associação Dungeon Belém"
                className="rounded-md"
                priority
                fetchPriority="high"
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
                    <Button onClick={() => setShowEmailForm(v => !v)} className="w-full py-3 text-md font-medium" variant="ghost">
                        Entrar com Email e Senha
                    </Button>
                </div>

                {showEmailForm && (
                    <div className="space-y-3">
                        <div>
                            <Label className="mb-1 text-sm">Email</Label>
                            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="seu@exemplo.com" />
                        </div>
                        <div>
                            <Label className="mb-1 text-sm">Senha</Label>
                            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Senha" />
                        </div>
                        <Button onClick={handleEmailLogin} className="w-full py-3 text-lg font-bold" disabled={isSigningIn}>
                            {isSigningIn ? <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Autenticando...</> : 'Entrar'}
                        </Button>
                    </div>
                )}
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
