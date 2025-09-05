
"use client"

import { MoreHorizontal, PlusCircle, ShieldCheck, UserCog, Ban, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getUsers } from "@/lib/mock-service"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { UserForm } from "@/components/app/user-form"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import type { AdminRole } from "@/lib/types/user"


export default function UsersPage() {
  const users = getUsers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const handleSuccess = () => {
    setIsModalOpen(false);
    toast({
      title: "Usuário Criado!",
      description: "O novo membro foi adicionado ao sistema com sucesso.",
    });
  };
  
  const roleBadgeVariant: Record<AdminRole, "default" | "secondary" | "outline"> = {
    Administrador: 'default',
    Editor: 'secondary',
    Revisor: 'outline',
  }

  return (
    <div className="grid gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">Visualize e gerencie os membros da associação.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Usuário
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Novo Membro</DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes abaixo para cadastrar um novo usuário no sistema.
                    </DialogDescription>
                </DialogHeader>
                <UserForm onSuccess={handleSuccess} onCancel={() => setIsModalOpen(false)} />
            </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membros</CardTitle>
          <CardDescription>Uma lista de todos os usuários cadastrados no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead className="hidden lg:table-cell">Nível de Acesso</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person" />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="font-medium">
                                <p>{user.name}</p>
                                <p className="text-sm text-muted-foreground hidden md:block">{user.email}</p>
                                {/* Badges e Ações para visualização mobile */}
                                <div className="flex flex-col items-start gap-2 mt-1 md:hidden">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={user.category === 'Master' ? 'default' : user.category === 'Gamer' ? 'secondary' : 'outline' }>{user.category}</Badge>
                                        {user.role ? (
                                            <Badge variant={roleBadgeVariant[user.role]}>{user.role}</Badge>
                                        ) : (
                                            <Badge variant="outline">Membro</Badge>
                                        )}
                                    </div>
                                    <div className="sm:hidden">
                                        <Badge variant={user.status === 'Ativo' ? 'secondary' : user.status === 'Pendente' ? 'outline' : 'destructive'} className={user.status === 'Ativo' ? 'bg-green-100 text-green-800' : ''}>
                                            {user.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="md:hidden">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                    <DropdownMenuItem><UserCog className="mr-2 h-4 w-4" />Editar Perfil</DropdownMenuItem>
                                    <DropdownMenuItem><ShieldCheck className="mr-2 h-4 w-4" />Alterar Nível de Acesso</DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10"><Ban className="mr-2 h-4 w-4" />Bloquear Usuário</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={user.category === 'Master' ? 'default' : user.category === 'Gamer' ? 'secondary' : 'outline' }>{user.category}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {user.role ? (
                        <Badge variant={roleBadgeVariant[user.role]}>{user.role}</Badge>
                    ) : (
                       <span className="text-muted-foreground">Membro</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-center">
                    <Badge variant={user.status === 'Ativo' ? 'secondary' : user.status === 'Pendente' ? 'outline' : 'destructive'} className={user.status === 'Ativo' ? 'bg-green-100 text-green-800' : ''}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex justify-end">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem><UserCog className="mr-2 h-4 w-4" />Editar Perfil</DropdownMenuItem>
                            <DropdownMenuItem><ShieldCheck className="mr-2 h-4 w-4" />Alterar Nível de Acesso</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10"><Ban className="mr-2 h-4 w-4" />Bloquear Usuário</DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
