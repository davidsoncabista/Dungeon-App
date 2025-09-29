
"use client"

import { MoreHorizontal, ShieldCheck, UserCog, Ban, Trash2, ArrowUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { UserForm } from "@/components/app/user-form"
import { useState, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import type { AdminRole, User, UserCategory } from "@/lib/types/user"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { app, auth } from "@/lib/firebase"
import { getFirestore, collection, doc, updateDoc, deleteDoc, query, orderBy, where } from "firebase/firestore"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { useAuthState } from "react-firebase-hooks/auth"

const roleBadgeClass: Record<AdminRole, string> = {
    Administrador: "bg-role-admin text-role-admin-foreground",
    Editor: "bg-role-editor text-role-editor-foreground",
    Revisor: "bg-role-revisor text-role-revisor-foreground",
    Membro: "hidden", // Não mostra badge para 'Membro'
    Visitante: "bg-muted text-muted-foreground",
    Convidado: "bg-blue-200 text-blue-800",
}

type SortKey = 'name' | 'category';

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
function EditRoleDialog({ user, onConfirm }: { user: User, onConfirm: (role: AdminRole) => void }) {
    const [selectedRole, setSelectedRole] = useState(user.role || 'Membro');
    const [isOpen, setIsOpen] = useState(false);

    const handleConfirm = () => {
        onConfirm(selectedRole as AdminRole);
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
                    <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AdminRole)}>
                        <SelectTrigger id="role-select" className="w-full mt-2">
                            <SelectValue placeholder="Selecione um nível" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Convidado">Convidado (Novo Usuário)</SelectItem>
                            <SelectItem value="Membro">Membro (Ex-Associado)</SelectItem>
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
function UserTableRow({ user, canEdit, canDelete }: { user: User; canEdit: boolean; canDelete: boolean; }) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const firestore = getFirestore(app);
    const { toast } = useToast();

    const handleAction = async (action: () => Promise<void>, title: string, description: string) => {
        try {
            await action();
            toast({ title, description });
        } catch (error: any) {
            console.error(`Erro ao executar ação: ${title}`, error);
            toast({
                title: "Erro na Operação",
                description: error.message || "Não foi possível completar a ação.",
                variant: "destructive"
            });
        }
    };
    
    const handleEditSuccess = (data: Partial<User>) => {
        handleAction(
            () => updateDoc(doc(firestore, "users", user.uid), data),
            "Usuário Atualizado!",
            `As informações de ${user.name} foram salvas.`
        );
        setIsEditModalOpen(false);
    };

    const handleBlockUser = () => handleAction(
        () => updateDoc(doc(firestore, "users", user.uid), { status: user.status === 'Bloqueado' ? 'Ativo' : 'Bloqueado' }),
        `Usuário ${user.status === 'Bloqueado' ? 'Desbloqueado' : 'Bloqueado'}!`,
        `${user.name} foi ${user.status === 'Bloqueado' ? 'desbloqueado' : 'bloqueado'} com sucesso.`
    );

    const handleDeleteUser = () => {
        if (!canDelete) return;
        handleAction(
            () => deleteDoc(doc(firestore, "users", user.uid)),
            "Usuário Excluído!",
            `${user.name} foi removido permanentemente do sistema.`
        );
    }

    const handleRoleChange = (newRole: AdminRole) => {
         if (!canDelete) return; // Apenas Admins podem mudar roles
        handleAction(
            () => updateDoc(doc(firestore, "users", user.uid), { role: newRole }),
            "Nível de Acesso Alterado!",
            `O nível de acesso de ${user.name} foi definido como ${newRole}.`
        );
    }

    return (
        <TableRow key={user.uid}>
            <TableCell>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person" />
                            <AvatarFallback>{user.name ? user.name.charAt(0) : 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">
                            <p>{user.name}</p>
                            <p className="text-sm text-muted-foreground md:hidden">{user.email}</p>
                            <div className="flex flex-col items-start gap-2 mt-1 sm:hidden">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant={user.category === 'Master' ? 'default' : user.category === 'Gamer' ? 'secondary' : 'outline'}>{user.category}</Badge>
                                    {user.role && user.role !== 'Membro' && (
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
                                    <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!canEdit}>
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                {canEdit && (
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                        <DialogTrigger asChild>
                                            <DropdownMenuItem><UserCog className="mr-2 h-4 w-4" />Editar Perfil</DropdownMenuItem>
                                        </DialogTrigger>
                                        {canDelete && <EditRoleDialog user={user} onConfirm={handleRoleChange} />}
                                        <DropdownMenuSeparator />
                                        <BlockUserDialog user={user} onConfirm={handleBlockUser} />
                                        {canDelete && <DeleteUserDialog user={user} onConfirm={handleDeleteUser} />}
                                    </DropdownMenuContent>
                                )}
                            </DropdownMenu>
                            <DialogContent className="sm:max-w-lg">
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
                {user.role && user.role !== 'Membro' ? (
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
            <TableCell className="hidden md:table-cell text-right">
                <div className="flex justify-end">
                    <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!canEdit}>
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            {canEdit && (
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                    <DialogTrigger asChild>
                                        <DropdownMenuItem><UserCog className="mr-2 h-4 w-4" />Editar Perfil</DropdownMenuItem>
                                    </DialogTrigger>
                                    {canDelete && <EditRoleDialog user={user} onConfirm={handleRoleChange} />}
                                    <DropdownMenuSeparator />
                                    <BlockUserDialog user={user} onConfirm={handleBlockUser} />
                                    {canDelete && <DeleteUserDialog user={user} onConfirm={handleDeleteUser} />}
                                </DropdownMenuContent>
                            )}
                        </DropdownMenu>
                         <DialogContent className="sm:max-w-lg">
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
export default function UsersPage() {
  const firestore = getFirestore(app);
  const [user] = useAuthState(auth);

  const usersRef = collection(firestore, 'users');
  const [users, loading, error] = useCollectionData<User>(usersRef, { idField: 'id' });
  
  const userQuery = user ? query(collection(firestore, 'users'), where('uid', '==', user.uid)) : null;
  const [appUser] = useCollectionData<User>(userQuery);
  const currentUserRole = appUser?.[0]?.role;

  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  
  const canEdit = currentUserRole === 'Administrador' || currentUserRole === 'Editor';
  const canDelete = currentUserRole === 'Administrador';


  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
        setSortKey(key);
        setSortOrder('asc');
    }
  }

  const filteredAndSortedUsers = useMemo(() => {
    if (!users) return [];
    
    let filtered = [...users];

    if (searchTerm) {
        const lowercasedTerm = searchTerm.toLowerCase();
        filtered = filtered.filter(u => 
            u.name.toLowerCase().includes(lowercasedTerm) || 
            u.email.toLowerCase().includes(lowercasedTerm)
        );
    }
    
    const categoryOrder: Record<UserCategory, number> = { "Master": 1, "Gamer": 2, "Player": 3, "Visitante": 4 };

    return filtered.sort((a, b) => {
        let comparison = 0;
        if (sortKey === 'name') {
            comparison = a.name.localeCompare(b.name);
        } else { // sort by category
            comparison = (categoryOrder[a.category] || 99) - (categoryOrder[b.category] || 99);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
    });

  }, [users, sortKey, sortOrder, searchTerm]);


  const renderContent = () => {
    if (loading) {
        return Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
                <TableCell>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex flex-col gap-1">
                             <Skeleton className="h-4 w-32" />
                             <Skeleton className="h-3 w-40" />
                        </div>
                    </div>
                </TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                <TableCell className="hidden sm:table-cell text-center"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                <TableCell className="hidden md:table-cell text-right"><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
            </TableRow>
        ));
    }

    if (error) {
        return <TableRow><TableCell colSpan={5} className="h-24 text-center text-destructive">Erro ao carregar usuários: {error.message}. Verifique as regras de segurança do Firestore.</TableCell></TableRow>;
    }

    if (!filteredAndSortedUsers || filteredAndSortedUsers.length === 0) {
        return <TableRow><TableCell colSpan={5} className="h-24 text-center">Nenhum usuário encontrado com os filtros atuais.</TableCell></TableRow>;
    }
    
    return filteredAndSortedUsers.map(u => (
        <UserTableRow
            key={u.uid}
            user={u}
            canEdit={canEdit}
            canDelete={canDelete}
        />
    ));
  }


  return (
    <div className="grid gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">Visualize e gerencie os membros da associação.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membros</CardTitle>
          <CardDescription>Uma lista de todos os usuários cadastrados no sistema. A criação de novos usuários é feita automaticamente quando eles logam com o Google pela primeira vez.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
             <Input 
                placeholder="Buscar por nome ou e-mail..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('name')} className="px-0">
                       Membro <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                    <Button variant="ghost" onClick={() => handleSort('category')} className="px-0">
                       Categoria <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </TableHead>
                <TableHead className="hidden md:table-cell">Nível de Acesso</TableHead>
                <TableHead className="hidden sm:table-cell text-center">Status</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderContent()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
