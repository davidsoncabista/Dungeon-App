
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Bell, ShieldAlert, Trash2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SettingsPage() {

  return (
    <div className="grid gap-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Configurações</h1>
        <p className="text-muted-foreground">Gerencie suas preferências de conta e notificações.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notificações</CardTitle>
          <CardDescription>Escolha como você quer ser notificado sobre as atividades da guilda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2 p-4 rounded-md border">
            <Label htmlFor="notification-new-booking" className="flex flex-col space-y-1">
              <span>Novas Reservas</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Receber um alerta quando alguém te convidar para uma sessão.
              </span>
            </Label>
            <Switch id="notification-new-booking" disabled />
          </div>
           <div className="flex items-center justify-between space-x-2 p-4 rounded-md border">
            <Label htmlFor="notification-birthday" className="flex flex-col space-y-1">
              <span>Aniversariantes do Dia</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Ser notificado sobre os aniversariantes do dia na guilda.
              </span>
            </Label>
            <Switch id="notification-birthday" disabled />
          </div>
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
              <CardTitle>Tema Visual</CardTitle>
              <CardDescription>Personalize a aparência do aplicativo.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Alternar entre modo claro e escuro.</p>
              <ThemeToggle />
          </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Gerenciamento da Conta</CardTitle>
          <CardDescription>Ações permanentes relacionadas à sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
            <Alert variant="destructive">
                <Trash2 className="h-4 w-4" />
                <AlertTitle>Excluir Conta</AlertTitle>
                <AlertDescription>
                    <p className="mb-4">Esta ação é irreversível. Todos os seus dados, incluindo perfil e histórico de reservas, serão permanentemente removidos. Deseja prosseguir?</p>
                    <Button variant="destructive" disabled>Excluir minha conta permanentemente</Button>
                </AlertDescription>
            </Alert>
        </CardContent>
      </Card>

    </div>
  )
}
