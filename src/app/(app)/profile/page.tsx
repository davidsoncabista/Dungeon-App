
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getAuthenticatedUser } from "@/lib/mock-service"
import { useToast } from "@/hooks/use-toast"
import { auth } from "@/lib/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProfilePage() {
  const user = getAuthenticatedUser()
  const { toast } = useToast()

  const handleSaveChanges = () => {
    toast({
      title: "Sucesso!",
      description: "Suas informações foram atualizadas.",
    })
  }
  
  const handleUpdatePassword = () => {
    toast({
        title: "Sucesso!",
        description: "Sua senha foi alterada com segurança.",
    })
  }

  const handleUpdateAvatar = () => {
    toast({
        title: "Em breve!",
        description: "A funcionalidade de upload de imagem será implementada em breve.",
        variant: "default",
      })
  }

  if (loading) {
    return (
        <div className="grid gap-8">
            <div>
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-4 w-1/2 mt-2" />
            </div>
            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-8 w-1/3" />
                            <Skeleton className="h-4 w-2/3" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-32" />
                        </CardContent>
                    </Card>
                </div>
                 <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                             <Skeleton className="h-8 w-1/2" />
                        </CardHeader>
                        <CardContent className="flex flex-col items-center gap-4">
                             <Skeleton className="h-32 w-32 rounded-full" />
                             <Skeleton className="h-10 w-32" />
                        </CardContent>
                    </Card>
                </div>
            </div>
             <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent className="space-y-4">
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>
        </div>
    )
  }

  if (!user) {
    // Idealmente, o layout já redirecionou, mas é uma boa prática ter um fallback.
    return <p>Usuário não encontrado. Por favor, faça login.</p>
  }


  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais e de segurança.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Atualize seu nome e e-mail.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" defaultValue={user.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Endereço de E-mail</Label>
                <Input id="email" type="email" defaultValue={user.email} />
              </div>
              <Button onClick={handleSaveChanges}>Salvar Alterações</Button>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Foto de Perfil</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <Avatar className="h-32 w-32">
                        <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person" />
                        <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" onClick={handleUpdateAvatar}>Alterar Foto</Button>
                </CardContent>
            </Card>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Alterar Senha</CardTitle>
          <CardDescription>Para sua segurança, escolha uma senha forte. (funcionalidade em desenvolvimento)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Senha Atual</Label>
            <Input id="current-password" type="password" disabled/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova Senha</Label>
            <Input id="new-password" type="password" disabled/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
            <Input id="confirm-password" type="password" disabled/>
          </div>
          <Button onClick={handleUpdatePassword} disabled>Atualizar Senha</Button>
        </CardContent>
      </Card>
    </div>
  )
}
