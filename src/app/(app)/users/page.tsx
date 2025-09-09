
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
<<<<<<< HEAD
import type { AdminRole } from "@/lib/types/user"


<<<<<<< HEAD
=======
=======
import type { AdminRole, User } from "@/lib/types/user"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"


>>>>>>> a7c0ffe1 (vamos mudar as cores dos badages  do nivel de acesso deixa diferente das)
const roleBadgeClass: Record<AdminRole, string> = {
    Administrador: "bg-role-admin text-role-admin-foreground",
    Editor: "bg-role-editor text-role-editor-foreground",
    Revisor: "bg-role-revisor text-role-revisor-foreground",
}

// --- Componentes de Modal ---

// Modal para Bloquear/Desbloquear Usuário
function BlockUserDialog({ user, onConfirm }: { user: User, onConfirm: () => void }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <button className="w-full text-left">
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Ban className="mr-2 h-4 w-4" />
                        {user.status === 'Bloqueado' ? 'Desbloquear Usuário' : 'Bloquear Usuário'}
                    </DropdownMenuItem>
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {user.status === 'Bloqueado' 
                          ? `Esta ação irá restaurar o acesso de ${user.name} ao sistema.`
                          : `Esta ação impedirá que ${user.name} acesse o sistema. O usuário não poderá fazer login ou realizar reservas.`
                        }
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} className={user.status !== 'Bloqueado' ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}>
                         {user.status === 'Bloqueado' ? 'Sim, desbloquear' : 'Sim, bloquear'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// Modal para Excluir Usuário
function DeleteUserDialog({ user, onConfirm }: { user: User, onConfirm: () => void }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                 <button className="w-full text-left">
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir permanentemente
                    </DropdownMenuItem>
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir {user.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação é irreversível. Todas as informações do usuário, incluindo seu histórico de reservas, serão permanentemente removidas.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Sim, excluir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// Modal para Alterar Nível de Acesso
function EditRoleDialog({ user, onConfirm }: { user: User, onConfirm: (role: AdminRole | 'Membro') => void }) {
    const [selectedRole, setSelectedRole] = useState(user.role || 'Membro');
    const [isOpen, setIsOpen] = useState(false);

    const handleConfirm = () => {
        onConfirm(selectedRole as AdminRole | 'Membro');
        setIsOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button className="w-full text-left">
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Alterar Nível de Acesso
                    </DropdownMenuItem>
                </button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Alterar Nível de Acesso de {user.name}</DialogTitle>
                    <DialogDescription>
                        Selecione o novo nível de permissão para este usuário.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="role-select">Nível de Acesso</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger id="role-select" className="w-full mt-2">
                            <SelectValue placeholder="Selecione um nível" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Membro">Membro (Sem acesso especial)</SelectItem>
                            <SelectItem value="Revisor">Revisor</SelectItem>
                            <SelectItem value="Editor">Editor</SelectItem>
                            <SelectItem value="Administrador">Administrador</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
                    <Button onClick={handleConfirm}>Salvar Alterações</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// --- Componente da Linha da Tabela ---
function UserTableRow({ user, onEditSuccess, onBlockSuccess, onDeleteSuccess, onRoleChangeSuccess }: { user: User; onEditSuccess: () => void; onBlockSuccess: (name: string, isBlocked: boolean) => void; onDeleteSuccess: (name: string) => void; onRoleChangeSuccess: (name: string, role: string) => void; }) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    const handleEditSuccess = () => {
        setIsEditModalOpen(false);
        onEditSuccess();
    }

    return (
        <TableRow>
            <TableCell>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person" />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">
                            <p>{user.name}</p>
                            <p className="text-sm text-muted-foreground md:hidden">{user.email}</p>
                            <div className="flex flex-col items-start gap-2 mt-1 sm:hidden">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant={user.category === 'Master' ? 'default' : user.category === 'Gamer' ? 'secondary' : 'outline'}>{user.category}</Badge>
                                    {user.role && (
                                        <Badge className={cn(roleBadgeClass[user.role])}>{user.role}</Badge>
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
                        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                    <DialogTrigger asChild>
                                        <DropdownMenuItem><UserCog className="mr-2 h-4 w-4" />Editar Perfil</DropdownMenuItem>
                                    </DialogTrigger>
                                    <EditRoleDialog user={user} onConfirm={(role) => onRoleChangeSuccess(user.name, role)} />
                                    <DropdownMenuSeparator />
                                    <BlockUserDialog user={user} onConfirm={() => onBlockSuccess(user.name, user.status !== 'Bloqueado')} />
                                    <DeleteUserDialog user={user} onConfirm={() => onDeleteSuccess(user.name)} />
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Editar Perfil de {user.name}</DialogTitle>
                                    <DialogDescription>
                                        Atualize as informações do membro abaixo.
                                    </DialogDescription>
                                </DialogHeader>
                                <UserForm onSuccess={handleEditSuccess} onCancel={() => setIsEditModalOpen(false)} isEditMode={true} defaultValues={user} />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
                <Badge variant={user.category === 'Master' ? 'default' : user.category === 'Gamer' ? 'secondary' : 'outline' }>{user.category}</Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">
                {user.role ? (
                    <Badge className={cn(roleBadgeClass[user.role])}>{user.role}</Badge>
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
                    <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DialogTrigger asChild>
                                    <DropdownMenuItem><UserCog className="mr-2 h-4 w-4" />Editar Perfil</DropdownMenuItem>
                                </DialogTrigger>
                                <EditRoleDialog user={user} onConfirm={(role) => onRoleChangeSuccess(user.name, role)} />
                                <DropdownMenuSeparator />
                                <BlockUserDialog user={user} onConfirm={() => onBlockSuccess(user.name, user.status !== 'Bloqueado')} />
                                <DeleteUserDialog user={user} onConfirm={() => onDeleteSuccess(user.name)} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                         <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Editar Perfil de {user.name}</DialogTitle>
                                <DialogDescription>
                                    Atualize as informações do membro abaixo.
                                </DialogDescription>
                            </DialogHeader>
                            <UserForm onSuccess={handleEditSuccess} onCancel={() => setIsEditModalOpen(false)} isEditMode={true} defaultValues={user} />
                        </DialogContent>
                    </Dialog>
                </div>
            </TableCell>
        </TableRow>
    );
}

// --- Página Principal ---
>>>>>>> cb79c7dc (no modal o botão de cancelar não esta funcionando ainda)
export default function UsersPage() {
  const users = getUsers();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();

<<<<<<< HEAD
  const handleSuccess = () => {
    setIsModalOpen(false);
=======
  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
>>>>>>> cb79c7dc (no modal o botão de cancelar não esta funcionando ainda)
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
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
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
<<<<<<< HEAD
                <UserForm onSuccess={handleSuccess} onCancel={() => setIsModalOpen(false)} />
=======
                <UserForm onSuccess={handleCreateSuccess} onCancel={() => setIsCreateModalOpen(false)} />
>>>>>>> cb79c7dc (no modal o botão de cancelar não esta funcionando ainda)
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
<<<<<<< HEAD
<<<<<<< HEAD
                <TableHead className="hidden lg:table-cell">Nível de Acesso</TableHead>
=======
                <TableHead className="hidden md:table-cell">Nível de Acesso</TableHead>
>>>>>>> eabfa384 (depos dessa mudança sumil d novo o ruler)
                <TableHead className="hidden sm:table-cell">Status</TableHead>
=======
                <TableHead className="hidden md:table-cell">Nível de Acesso</TableHead>
                <TableHead className="hidden sm:table-cell text-center">Status</TableHead>
>>>>>>> cb79c7dc (no modal o botão de cancelar não esta funcionando ainda)
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
<<<<<<< HEAD
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
<<<<<<< HEAD
<<<<<<< HEAD
                                <div className="flex flex-col items-start gap-2 mt-1 md:hidden">
                                    <div className="flex items-center gap-2">
=======
                                <div className="flex flex-col items-start gap-2 mt-1 sm:hidden">
                                    <div className="flex items-center gap-2 flex-wrap">
>>>>>>> eabfa384 (depos dessa mudança sumil d novo o ruler)
                                        <Badge variant={user.category === 'Master' ? 'default' : user.category === 'Gamer' ? 'secondary' : 'outline' }>{user.category}</Badge>
                                        {user.role ? (
                                            <Badge variant={roleBadgeVariant[user.role]}>{user.role}</Badge>
                                        ) : (
                                            <Badge variant="outline">Membro</Badge>
=======
                                <div className="flex flex-col items-start gap-2 mt-1 sm:hidden">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant={user.category === 'Master' ? 'default' : user.category === 'Gamer' ? 'secondary' : 'outline'}>{user.category}</Badge>
                                        {user.role && (
                                            <Badge className={cn(roleBadgeClass[user.role])}>{user.role}</Badge>
>>>>>>> a7c0ffe1 (vamos mudar as cores dos badages  do nivel de acesso deixa diferente das)
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
<<<<<<< HEAD
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
=======
                             <Dialog>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Toggle menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                        <DialogTrigger asChild>
                                            <DropdownMenuItem><UserCog className="mr-2 h-4 w-4" />Editar Perfil</DropdownMenuItem>
                                        </DialogTrigger>
                                        <EditRoleDialog user={user} onConfirm={(role) => handleRoleChangeSuccess(user.name, role)} />
                                        <DropdownMenuSeparator />
                                        <BlockUserDialog user={user} onConfirm={() => handleBlockSuccess(user.name, user.status !== 'Bloqueado')} />
                                        <DeleteUserDialog user={user} onConfirm={() => handleDeleteSuccess(user.name)} />
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Editar Perfil de {user.name}</DialogTitle>
                                        <DialogDescription>
                                            Atualize as informações do membro abaixo.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <UserForm onSuccess={handleEditSuccess} onCancel={() => {}} isEditMode={true} defaultValues={user} />
                                </DialogContent>
                            </Dialog>
>>>>>>> eabfa384 (depos dessa mudança sumil d novo o ruler)
                        </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={user.category === 'Master' ? 'default' : user.category === 'Gamer' ? 'secondary' : 'outline' }>{user.category}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {user.role ? (
                        <Badge className={cn(roleBadgeClass[user.role])}>{user.role}</Badge>
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
<<<<<<< HEAD
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
=======
                       <Dialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                    <DialogTrigger asChild>
                                        <DropdownMenuItem><UserCog className="mr-2 h-4 w-4" />Editar Perfil</DropdownMenuItem>
                                    </DialogTrigger>
                                    <EditRoleDialog user={user} onConfirm={(role) => handleRoleChangeSuccess(user.name, role)} />
                                    <DropdownMenuSeparator />
                                    <BlockUserDialog user={user} onConfirm={() => handleBlockSuccess(user.name, user.status !== 'Bloqueado')} />
                                    <DeleteUserDialog user={user} onConfirm={() => handleDeleteSuccess(user.name)} />
                                </DropdownMenuContent>
                            </DropdownMenu>
                             <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Editar Perfil de {user.name}</DialogTitle>
                                    <DialogDescription>
                                        Atualize as informações do membro abaixo.
                                    </DialogDescription>
                                </DialogHeader>
                                <UserForm onSuccess={handleEditSuccess} onCancel={() => {}} isEditMode={true} defaultValues={user} />
                            </DialogContent>
                        </Dialog>
>>>>>>> eabfa384 (depos dessa mudança sumil d novo o ruler)
                    </div>
                  </TableCell>
                </TableRow>
=======
                <UserTableRow
                    key={user.id}
                    user={user}
                    onEditSuccess={handleEditSuccess}
                    onBlockSuccess={handleBlockSuccess}
                    onDeleteSuccess={handleDeleteSuccess}
                    onRoleChangeSuccess={handleRoleChangeSuccess}
                />
>>>>>>> cb79c7dc (no modal o botão de cancelar não esta funcionando ainda)
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

    