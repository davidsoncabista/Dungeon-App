
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Users, Calendar, AlertCircle, Search, Trash2 } from "lucide-react/dist/esm/icons";
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Room } from "@/lib/types/room"
import type { Booking } from "@/lib/types/booking"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DialogFooter } from "@/components/ui/dialog"
import { useState, useMemo } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { app, auth } from "@/lib/firebase"
import { getFirestore, collection, query, orderBy } from "firebase/firestore"
import type { User } from "@/lib/types/user"
import { Skeleton } from "../ui/skeleton"
import { ScrollArea } from "../ui/scroll-area"
import { Checkbox } from "../ui/checkbox"
import { Separator } from "../ui/separator"
import { DeleteBookingDialog } from "@/components/app/dashboard/delete-booking-dialog"

const editBookingFormSchema = (maxCapacity: number) => z.object({
  title: z.string().min(3, { message: "O título deve ter pelo menos 3 caracteres." }).max(50, { message: "O título não pode ter mais de 50 caracteres."}),
  description: z.string().max(200, {message: "A descrição não pode ter mais de 200 caracteres."}).optional(),
  participants: z.array(z.string()).min(1, { message: "Você deve selecionar pelo menos um participante (você mesmo)." }),
  guests: z.array(z.string()).optional().default([]),
}).refine(data => (data.participants.length + (data.guests?.length ?? 0)) <= maxCapacity, {
    message: `O número total de participantes (membros + convidados) não pode exceder a capacidade da sala (${maxCapacity}).`,
    path: ["guests"],
});

interface BookingEditFormProps {
    booking: Booking;
    room: Room;
    onSuccess: (data: Partial<Omit<Booking, 'id'>>) => void;
    onCancel: () => void;
    onDelete: () => void;
    canCancel: boolean;
}

export function BookingEditForm({ booking, room, onSuccess, onCancel, onDelete, canCancel }: BookingEditFormProps) {
    const [user] = useAuthState(auth);
    const firestore = getFirestore(app);
    const usersRef = collection(firestore, 'users');
    
    const [allUsers, loadingUsers] = useCollectionData<User>(query(usersRef, orderBy("name")), { idField: 'id' });
    
    const [memberSearchTerm, setMemberSearchTerm] = useState("");
    const [guestSearchTerm, setGuestSearchTerm] = useState("");

    const formSchema = editBookingFormSchema(room.capacity);
    type BookingFormValues = z.infer<typeof formSchema>;

    const form = useForm<BookingFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: booking.title || "",
            description: booking.description || "",
            participants: booking.participants || [],
            guests: booking.guests || [],
        },
    });

    const formattedDate = format(parseISO(booking.date), "PPP", { locale: ptBR });
    const totalParticipants = (form.watch("participants")?.length || 0) + (form.watch("guests")?.length || 0);

    const { activeMembers, inactiveOrVisitors } = useMemo(() => {
        if (!allUsers) return { activeMembers: [], inactiveOrVisitors: [] };
        
        const active = allUsers.filter(u => u.status === 'Ativo' && u.category !== 'Visitante');
        const inactive = allUsers.filter(u => u.status !== 'Ativo' || u.category === 'Visitante');

        return { activeMembers: active, inactiveOrVisitors: inactive };
    }, [allUsers]);

    const filteredMembers = useMemo(() => 
        activeMembers.filter(u => 
            u.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) || 
            (u.nickname && u.nickname.toLowerCase().includes(memberSearchTerm.toLowerCase()))
        ), [activeMembers, memberSearchTerm]);

    const filteredGuests = useMemo(() =>
        inactiveOrVisitors.filter(u => 
            u.name.toLowerCase().includes(guestSearchTerm.toLowerCase()) || 
            (u.nickname && u.nickname.toLowerCase().includes(guestSearchTerm.toLowerCase()))
        ), [inactiveOrVisitors, guestSearchTerm]);


    function onSubmit(data: BookingFormValues) {
        onSuccess(data);
    }
    
    const handleToggle = (userId: string, isGuest: boolean) => {
        const field = isGuest ? "guests" : "participants";
        const currentValues = form.getValues(field);
        const newValues = currentValues.includes(userId)
            ? currentValues.filter(id => id !== userId)
            : [...currentValues, userId];

        if (userId === user?.uid) return;

        form.setValue(field, newValues, { shouldValidate: true });
    };

    if (loadingUsers || !allUsers) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
                 <DialogFooter>
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </DialogFooter>
            </div>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                 <div className="space-y-2 border-b pb-4 mb-4">
                    <div className="flex items-center gap-4 text-sm flex-wrap">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                                Capacidade: {totalParticipants} / {room.capacity}
                            </span>
                        </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Horário: {booking.startTime} - {booking.endTime} (não editável)
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Título da Reserva</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Campanha de D&D" {...field} />
                            </FormControl>
                            <FormDescription>Dê um nome para sua sessão de jogo.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Descrição (Opcional)</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="Um breve resumo do que será jogado ou do evento."
                            className="resize-none"
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="space-y-4">
                    {/* Members Section */}
                    <div className="space-y-2">
                        <FormLabel>Membros</FormLabel>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Buscar membro por nome ou apelido..." className="pl-9" onChange={(e) => setMemberSearchTerm(e.target.value)} />
                        </div>
                        <ScrollArea className="h-32 rounded-md border">
                            <div className="p-4 space-y-1">
                                {filteredMembers.map(u => (
                                    <div key={u.uid} className="flex items-center space-x-3 p-2 rounded-md">
                                        <Checkbox id={`edit-member-${u.uid}`} checked={form.watch('participants').includes(u.uid)} onCheckedChange={() => handleToggle(u.uid, false)} disabled={u.uid === user?.uid} />
                                        <label htmlFor={`edit-member-${u.uid}`} className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                            {u.name} {u.nickname && `(${u.nickname})`}
                                        </label>
                                    </div>
                                ))}
                                {filteredMembers.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">Nenhum membro encontrado.</p>}
                            </div>
                        </ScrollArea>
                    </div>
                    
                    <Separator />

                    {/* Guests Section */}
                    <div className="space-y-2">
                        <FormLabel>Convidados</FormLabel>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Buscar convidado por nome ou apelido..." className="pl-9" onChange={(e) => setGuestSearchTerm(e.target.value)} />
                        </div>
                        <ScrollArea className="h-32 rounded-md border">
                            <div className="p-4 space-y-1">
                                {filteredGuests.map(u => (
                                    <div key={u.uid} className="flex items-center space-x-3 p-2 rounded-md opacity-75">
                                        <Checkbox id={`edit-guest-${u.uid}`} checked={form.watch('guests').includes(u.uid)} onCheckedChange={() => handleToggle(u.uid, true)} />
                                        <label htmlFor={`edit-guest-${u.uid}`} className="flex-1 text-sm font-medium leading-none cursor-pointer">
                                            {u.name} {u.nickname && `(${u.nickname})`}
                                        </label>
                                        <Badge variant="outline">{u.category}</Badge>
                                    </div>
                                ))}
                                {filteredGuests.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">Nenhum convidado encontrado.</p>}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
                
                {form.formState.errors.guests?.message && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {form.formState.errors.guests.message}
                        </AlertDescription>
                    </Alert>
                )}
                <DialogFooter className="pt-4">
                    <div className="flex w-full justify-between items-center">
                        <DeleteBookingDialog onConfirm={onDelete} disabled={!canCancel} disabledReason="Não é possível cancelar reservas com menos de 5h de antecedência.">
                             <Button type="button" variant="destructive" disabled={!canCancel}>
                                <Trash2 className="mr-2 h-4 w-4"/>
                                Cancelar Reserva
                             </Button>
                        </DeleteBookingDialog>
                        
                        <div className="flex gap-2">
                            <Button type="button" variant="ghost" onClick={onCancel}>
                                Fechar
                            </Button>
                            <Button type="submit">Salvar Alterações</Button>
                        </div>
                    </div>
                </DialogFooter>
            </form>
        </Form>
    );
}
