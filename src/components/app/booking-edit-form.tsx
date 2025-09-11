
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, Users, Calendar, AlertCircle } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Room } from "@/lib/types/room"
import type { Booking } from "@/lib/types/booking"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DialogFooter } from "@/components/ui/dialog"
import { useMemo } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { app, auth } from "@/lib/firebase"
import { getFirestore, collection, query, orderBy } from "firebase/firestore"
import type { User } from "@/lib/types/user"
import { Skeleton } from "../ui/skeleton"

const editBookingFormSchema = (maxCapacity: number) => z.object({
  title: z.string().min(3, { message: "O título deve ter pelo menos 3 caracteres." }).max(50, { message: "O título não pode ter mais de 50 caracteres."}),
  description: z.string().max(200, {message: "A descrição não pode ter mais de 200 caracteres."}).optional(),
  participants: z.array(z.string()).min(1, { message: "Você deve selecionar pelo menos um participante (você mesmo)." }),
  guests: z.coerce.number().int().min(0, {message: "O número de convidados não pode ser negativo."}).optional().default(0),
}).refine(data => (data.participants.length + (data.guests ?? 0)) <= maxCapacity, {
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
    const usersQuery = query(usersRef, orderBy("name"));
    const [allUsers, loadingUsers] = useCollectionData<User>(usersQuery, { idField: 'id' });

    const formSchema = editBookingFormSchema(room.capacity);
    type BookingFormValues = z.infer<typeof formSchema>;

    const form = useForm<BookingFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: booking.title || "",
            description: booking.description || "",
            participants: booking.participants || [],
            guests: booking.guests || 0,
        },
    });

    const formattedDate = format(parseISO(booking.date), "PPP", { locale: ptBR });
    const totalParticipants = (form.watch("participants")?.length || 0) + (form.watch("guests") || 0);

    const selectedParticipantDetails = useMemo(() => {
        if (!allUsers || !form.watch("participants")) return [];
        return form.watch("participants").map(uid => allUsers.find(u => u.uid === uid)).filter(Boolean) as User[];
    }, [allUsers, form.watch("participants")]);

    function onSubmit(data: BookingFormValues) {
        onSuccess(data);
    }

    if (loadingUsers || !allUsers) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
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
                 <FormField
                    control={form.control}
                    name="participants"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Participantes (Membros)</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                        "w-full justify-between h-auto min-h-10",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                        <div className="flex gap-1 flex-wrap">
                                            {selectedParticipantDetails.map(p => (
                                                <Badge variant="secondary" key={p.uid}>{p.name.split(" ")[0]}</Badge>
                                            ))}
                                            {field.value.length === 0 && "Selecione os participantes"}
                                        </div>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Buscar membro..." />
                                    <CommandList>
                                        <CommandEmpty>Nenhum membro encontrado.</CommandEmpty>
                                        <CommandGroup>
                                            {allUsers.map((u) => (
                                            <CommandItem
                                                value={u.name}
                                                key={u.uid}
                                                onSelect={() => {
                                                    const currentValues = field.value || [];
                                                    const newValue = currentValues.includes(u.uid)
                                                        ? currentValues.filter(id => id !== u.uid)
                                                        : [...currentValues, u.uid];
                                                    field.onChange(newValue);
                                                }}
                                                disabled={u.uid === user?.uid}
                                            >
                                                <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    field.value.includes(u.uid) ? "opacity-100" : "opacity-0"
                                                )}
                                                />
                                                {u.name}
                                            </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <FormDescription>Inclua você e outros membros que participarão.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="guests"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Convidados (Não-Membros)</FormLabel>
                        <FormControl>
                            <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormDescription>Número de participantes que não são membros.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                
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

    