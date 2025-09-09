
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
import { getAuthenticatedUser, getUsers } from "@/lib/mock-service"
import type { Room } from "@/lib/types/room"
import type { Booking } from "@/lib/types/booking"
import { format, parseISO, parse, isBefore, addMinutes } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getBookingDurationAndEnd } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DialogFooter } from "@/components/ui/dialog"
import { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const allUsers = getUsers();
const currentUser = getAuthenticatedUser();

const editBookingFormSchema = (maxCapacity: number) => z.object({
  title: z.string().min(3, { message: "O título deve ter pelo menos 3 caracteres." }).max(50, { message: "O título não pode ter mais de 50 caracteres."}),
  description: z.string().max(200, {message: "A descrição não pode ter mais de 200 caracteres."}).optional(),
  participants: z.array(z.string()).min(1, { message: "Você deve selecionar pelo menos um participante (você mesmo)." }),
  guests: z.coerce.number().int().min(0, {message: "O número de convidados não pode ser negativo."}).optional().default(0),
  // startTime e endTime podem não estar presentes se a lógica de edição for diferente
}).refine(data => (data.participants.length + (data.guests ?? 0)) <= maxCapacity, {
    message: `O número total de participantes (membros + convidados) não pode exceder a capacidade da sala (${maxCapacity}).`,
    path: ["guests"],
});

interface BookingEditFormProps {
    booking: Booking;
    room: Room;
    allBookings: Booking[];
    onSuccess: (data: Partial<Omit<Booking, 'id'>>) => void;
    onCancel: () => void;
}

export function BookingEditForm({ booking, room, onSuccess, onCancel }: BookingEditFormProps) {
    const formSchema = editBookingFormSchema(room.capacity);
    type BookingFormValues = z.infer<typeof formSchema>;

    const form = useForm<BookingFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: booking.title || "",
            description: booking.description || "",
            participants: booking.participants.map(p => p.id),
            guests: booking.guests || 0,
        },
    });

    const formattedDate = format(parseISO(booking.date), "PPP", { locale: ptBR });
    const totalParticipants = (form.watch("participants")?.length || 0) + (form.watch("guests") || 0);

    function onSubmit(data: BookingFormValues) {
        const participantDetails = data.participants.map(id => allUsers.find(u => u.id === id)).filter(Boolean) as any[];
        
        const updatedData = {
            ...data,
            participants: participantDetails,
        };
        
        onSuccess(updatedData);
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
                                            {field.value.map(userId => {
                                                const user = allUsers.find(u => u.id === userId);
                                                return <Badge variant="secondary" key={userId}>{user?.name.split(" ")[0]}</Badge>
                                            })}
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
                                            {allUsers.map((user) => (
                                            <CommandItem
                                                value={user.name}
                                                key={user.id}
                                                onSelect={() => {
                                                    const currentValues = field.value || [];
                                                    const newValue = currentValues.includes(user.id)
                                                        ? currentValues.filter(id => id !== user.id)
                                                        : [...currentValues, user.id];
                                                    field.onChange(newValue);
                                                }}
                                                disabled={user.id === currentUser.id}
                                            >
                                                <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    field.value.includes(user.id) ? "opacity-100" : "opacity-0"
                                                )}
                                                />
                                                {user.name}
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

    