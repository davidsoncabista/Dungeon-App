import { Dices } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function LoginPage() {
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
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="membro@adbelem.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" required />
              </div>
              <Button asChild className="w-full py-6 text-lg font-bold">
                <Link href="/">Entrar</Link>
              </Button>
            </form>
            <div className="mt-6 text-center text-sm">
              <Link href="#" className="text-muted-foreground transition-colors hover:text-primary">
                Esqueceu a senha?
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
