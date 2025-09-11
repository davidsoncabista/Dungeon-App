
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, Ticket, CalendarCheck, Save } from "lucide-react"

const plans = [
    { name: "Player", price: 30, weeklyQuota: 1, monthlyQuota: 2, invites: 1 },
    { name: "Gamer", price: 50, weeklyQuota: 2, monthlyQuota: 4, invites: 2 },
    { name: "Master", price: 70, weeklyQuota: 7, monthlyQuota: 99, invites: 4 },
]

export default function AdminPage() {

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Administração do Sistema</h1>
        <p className="text-muted-foreground">Gerencie as regras de negócio, planos e configurações da plataforma.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="grid gap-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <CalendarCheck className="h-6 w-6 text-primary" />
                        <div>
                            <CardTitle>Regras de Cota de Reserva</CardTitle>
                            <CardDescription>Defina os limites semanais e mensais para cada categoria.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Plano</TableHead>
                                <TableHead className="text-center">Semanal</TableHead>
                                <TableHead className="text-center">Mensal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {plans.map(plan => (
                                <TableRow key={plan.name}>
                                    <TableCell className="font-bold">{plan.name}</TableCell>
                                    <TableCell>
                                        <Input type="number" defaultValue={plan.weeklyQuota} className="w-20 mx-auto text-center" />
                                    </TableCell>
                                    <TableCell>
                                        <Input type="number" defaultValue={plan.monthlyQuota} className="w-20 mx-auto text-center" />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                     <div className="flex items-center gap-3">
                        <Ticket className="h-6 w-6 text-primary" />
                        <div>
                            <CardTitle>Regras de Cota de Convite</CardTitle>
                            <CardDescription>Limite de convidados (não-membros) por reserva para cada categoria.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="invite-player" className="font-bold">Player</Label>
                        <Input id="invite-player" type="number" defaultValue="1" className="w-24" />
                    </div>
                     <div className="flex items-center justify-between">
                        <Label htmlFor="invite-gamer" className="font-bold">Gamer</Label>
                        <Input id="invite-gamer" type="number" defaultValue="2" className="w-24" />
                    </div>
                     <div className="flex items-center justify-between">
                        <Label htmlFor="invite-master" className="font-bold">Master</Label>
                        <Input id="invite-master" type="number" defaultValue="4" className="w-24" />
                    </div>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                 <div className="flex items-center gap-3">
                    <DollarSign className="h-6 w-6 text-primary" />
                    <div>
                        <CardTitle>Gerenciamento de Planos e Preços</CardTitle>
                        <CardDescription>Atualize os valores das mensalidades de cada plano.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Plano</TableHead>
                            <TableHead className="text-right">Preço (R$)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {plans.map(plan => (
                             <TableRow key={plan.name}>
                                <TableCell className="font-bold">{plan.name}</TableCell>
                                <TableCell className="text-right">
                                     <Input type="number" defaultValue={plan.price} className="w-28 ml-auto" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-end mt-4">
        <Button size="lg">
            <Save className="mr-2 h-4 w-4" />
            Salvar Todas as Alterações
        </Button>
      </div>

    </div>
  )
}
