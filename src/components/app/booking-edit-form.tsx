
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
import { Users, Calendar, AlertCircle, Search } from "lucide-react"
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
import { getFirestore, collection, query, orderBy, where } from "firebase/firestore"
import type { User } from "@/lib/types/user"
import { Skeleton } from "../ui/skeleton"
import { ScrollArea } from "../ui/scroll-area"
import { Checkbox } from "../ui/checkbox"

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
}

export function BookingEditForm({ booking, room, onSuccess, onCancel }: BookingEditFormProps) {
    const [user] = useAuthState(auth);
    const firestore = getFirestore(app);
    const usersRef = collection(firestore, 'users');
    
    // Busca todos os usuários para popular os seletores
    const [allUsers, loadingUsers] = useCollectionData<User>(query(usersRef, orderBy("name")), { idField: 'id' });
    const [searchTerm, setSearchTerm] = useState("");

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

    const { activeMembers, potentialGuests, filteredUsers } = useMemo(() => {
        if (!allUsers) return { activeMembers: [], potentialGuests: [], filteredUsers: [] };
        
        const active = allUsers.filter(u => u.status === 'Ativo' && u.category !== 'Visitante');
        const guests = allUsers.filter(u => u.status !== 'Ativo' || u.category === 'Visitante');

        const combinedList = [...active, ...guests];
        const filtered = searchTerm
            ? combinedList.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
            : combinedList;

        return { activeMembers: active, potentialGuests: guests, filteredUsers: filtered };
    }, [allUsers, searchTerm]);


    function onSubmit(data: BookingFormValues) {
        onSuccess(data);
    }
    
    const handleUserToggle = (toggledUser: User) => {
        const isGuest = potentialGuests.some(g => g.uid === toggledUser.uid);
        const field = isGuest ? "guests" : "participants";
        const currentValues = form.getValues(field);
        const newValues = currentValues.includes(toggledUser.uid)
            ? currentValues.filter(uid => uid !== toggledUser.uid)
            : [...currentValues, toggledUser.uid];

        // O organizador não pode ser desmarcado
        if (toggledUser.uid === user?.uid) return;

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
                <div className="space-y-2">
                    <FormLabel>Participantes e Convidados</FormLabel>
                    <FormDescription>Selecione os membros e convidados para a sessão.</FormDescription>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar por nome..."
                            className="pl-9"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <ScrollArea className="h-48 rounded-md border">
                        <div className="p-4 space-y-2">
                            {filteredUsers.map(u => {
                                const isGuest = potentialGuests.some(g => g.uid === u.uid);
                                const isChecked = form.watch('participants').includes(u.uid) || form.watch('guests').includes(u.uid);
                                return (
                                    <div 
                                        key={u.uid} 
                                        className={cn(
                                            "flex items-center space-x-3 p-2 rounded-md transition-colors cursor-pointer hover:bg-muted/50",
                                            isGuest && "opacity-75"
                                        )}
                                        onClick={() => handleUserToggle(u)}
                                    >
                                        <Checkbox 
                                            checked={isChecked}
                                            disabled={u.uid === user?.uid} // Organizador não pode ser desmarcado
                                            aria-label={`Selecionar ${u.name}`}
                                        />
                                        <label className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                            {u.name}
                                        </label>
                                        {isGuest && <Badge variant="outline">{u.category}</Badge>}
                                    </div>
                                )
                            })}
                            {filteredUsers.length === 0 && (
                                <p className="text-center text-sm text-muted-foreground py-4">Nenhum usuário encontrado.</p>
                            )}
                        </div>
                    </ScrollArea>
                </div>
                
                {form.formState.errors.guests?.message && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {form.formState.errors.guests.message}
                        </AlertDescription>
                    </Alert>
                )}
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button type="submit">Salvar Alterações</Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

    