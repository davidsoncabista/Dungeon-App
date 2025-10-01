
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gerenciamento de Salas',
  description: 'Crie, edite e gerencie as salas de jogo da associação.',
};
"use client"

import { MoreHorizontal, PlusCircle, Pencil, Trash2, ShieldAlert } from "lucide-react"
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
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { getFirestore, collection, query, orderBy, setDoc, updateDoc, doc, deleteDoc, where } from "firebase/firestore"
import { app, auth } from "@/lib/firebase"
import type { Room } from "@/lib/types/room"
import { Skeleton } from "@/components/ui/skeleton"
import { RoomForm } from "@/components/app/rooms/room-form"
import { useAuthState } from "react-firebase-hooks/auth"
import type { User } from "@/lib/types/user"

// --- COMPONENTE DA LINHA DA TABELA ---
function RoomTableRow({ room, canEdit }: { room: Room, canEdit: boolean }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const firestore = getFirestore(app);

  const handleSave = async (data: Partial<Room>) => {
    try {
      const roomRef = doc(firestore, "rooms", room.id);
      await updateDoc(roomRef, data);
      toast({ title: "Sala Atualizada!", description: "As informações da sala foram salvas." });
      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error("Erro ao atualizar sala:", error);
      toast({ title: "Erro de Permissão!", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(firestore, "rooms", room.id));
      toast({ title: "Sala Excluída!", description: `A sala ${room.name} foi removida.` });
    } catch (error: any) {
      console.error("Erro ao excluir sala:", error);
      toast({ title: "Erro de Permissão!", description: error.message, variant: "destructive" });
    }
  };

  return (
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <TableRow className="cursor-pointer">
                        <TableCell className="hidden w-[128px] sm:table-cell">
                            {room.image ? (
                            <Image
                                alt={room.name}
                                className="aspect-video rounded-md object-cover"
                                height="64"
                                src={room.image}
                                width="128"
                                data-ai-hint="rpg room"
                            />
                            ) : (
                            <div className="w-full aspect-video bg-muted rounded-md flex items-center justify-center">
                                    <span className="text-xs text-muted-foreground">Sem imagem</span>
                            </div>
                            )}
                        </TableCell>
                        <TableCell className="font-medium">
                            {room.name}
                            <p className="text-sm text-muted-foreground md:hidden">{room.description}</p>
                        </TableCell>
                        <TableCell>{room.capacity} pessoas</TableCell>
                        <TableCell className="hidden md:table-cell">
                            <Badge variant={room.status === 'Disponível' ? 'secondary' : room.status === 'Ocupada' ? 'outline' : 'destructive'} className={room.status === 'Disponível' ? 'bg-green-100 text-green-800' : ''}>
                            {room.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="hidden text-right md:table-cell">
                             <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!canEdit}>
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </TableCell>
                    </TableRow>
                </DropdownMenuTrigger>
                 <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)} disabled={!canEdit}>
                        <Pencil className="mr-2 h-4 w-4" />Editar Sala
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" disabled={!canEdit}>
                            <Trash2 className="mr-2 h-4 w-4" />Excluir Sala
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Edit Dialog */}
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar {room.name}</DialogTitle>
                <DialogDescription>Atualize as informações da sala abaixo.</DialogDescription>
              </DialogHeader>
              <RoomForm defaultValues={room} onSave={handleSave} onCancel={() => setIsEditDialogOpen(false)} />
            </DialogContent>

            {/* Delete Dialog */}
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação é irreversível. Todas as reservas associadas a esta sala também podem ser afetadas.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Sim, excluir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>

        </AlertDialog>
     </Dialog>
  )
}

// --- PÁGINA PRINCIPAL ---
export default function RoomsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();
  const [user] = useAuthState(auth);
  const firestore = getFirestore(app);

  const roomsRef = collection(firestore, 'rooms');
  const roomsQuery = query(roomsRef, orderBy("name"));
  const [rooms, loadingRooms, errorRooms] = useCollectionData<Room>(roomsQuery, { idField: 'id' });
  
  const userQuery = user ? query(collection(firestore, 'users'), where('uid', '==', user.uid)) : null;
  const [appUser] = useCollectionData<User>(userQuery);
  const currentUserRole = appUser?.[0]?.role;
  const canEdit = currentUserRole === 'Administrador' || currentUserRole === 'Editor';


  const handleCreateRoom = async (data: Omit<Room, 'id' | 'uid'>) => {
    try {
      const newRoomRef = doc(roomsRef);
      const newRoomId = newRoomRef.id;

      const dataToSave: Room = {
        ...data,
        id: newRoomId,
        uid: newRoomId,
      };

      await setDoc(newRoomRef, dataToSave);

      toast({ title: "Sala Criada!", description: `A sala "${data.name}" foi adicionada com sucesso.` });
      setIsCreateModalOpen(false);
    } catch (err: any) {
      console.error("Erro ao criar sala:", err);
      toast({ title: "Erro de Permissão!", description: err.message || "Não foi possível criar a nova sala.", variant: "destructive" });
    }
  };

  const renderContent = () => {
    if (loadingRooms) {
      return Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell className="hidden sm:table-cell"><Skeleton className="h-[64px] w-[128px] rounded-md" /></TableCell>
          <TableCell><Skeleton className="h-6 w-3/4" /></TableCell>
          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
          <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-20" /></TableCell>
          <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
        </TableRow>
      ));
    }

    if (errorRooms) {
      return (
        <TableRow>
          <TableCell colSpan={5}>
            <div className="flex items-center gap-4 p-4 bg-destructive/10 border border-destructive rounded-md">
                <ShieldAlert className="h-8 w-8 text-destructive" />
                <div>
                    <h4 className="font-bold text-destructive">Erro de Permissão</h4>
                    <p className="text-sm text-destructive/80">Não foi possível buscar os dados das salas. Verifique suas permissões de acesso. (${errorRooms.message})</p>
                </div>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (!rooms || rooms.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="text-center h-24">Nenhuma sala encontrada. Que tal criar a primeira?</TableCell>
        </TableRow>
      )
    }

    return rooms.map(room => (
      <RoomTableRow key={room.id} room={room} canEdit={canEdit} />
    ));
  }

  return (
    <div className="grid gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Gerenciamento de Salas</h1>
          <p className="text-muted-foreground">Crie, edite e gerencie as salas de jogo.</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
                <Button disabled={!canEdit} className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nova Sala
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Criar Nova Sala</DialogTitle>
                    <DialogDescription>Preencha os detalhes da nova sala de jogo.</DialogDescription>
                </DialogHeader>
                <RoomForm onSave={handleCreateRoom} onCancel={() => setIsCreateModalOpen(false)} />
            </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Salas de Jogo</CardTitle>
          <CardDescription>Uma lista de todas as salas disponíveis na associação.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  Imagem
                </TableHead>
                <TableHead>Nome da Sala</TableHead>
                <TableHead>Capacidade</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
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
