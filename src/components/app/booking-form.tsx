
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
import { format, parseISO, parse, isBefore, addMinutes } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getBookingDurationAndEnd, FIXED_SLOTS } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DialogFooter } from "@/components/ui/dialog"
import { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, app } from "@/lib/firebase"
import { getFirestore, collection, query, orderBy } from "firebase/firestore"
import { useCollectionData } from "react-firebase-hooks/firestore"
import type { User } from "@/lib/types/user"
import { Skeleton } from "../ui/skeleton"
import { ScrollArea } from "../ui/scroll-area"
import { Checkbox } from "../ui/checkbox"

const createBookingFormSchema = (maxCapacity: number) => z.object({
  title: z.string().min(3, { message: "O título deve ter pelo menos 3 caracteres." }).max(50, { message: "O título não pode ter mais de 50 caracteres."}),
  description: z.string().max(200, {message: "A descrição não pode ter mais de 200 caracteres."}).optional(),
  participants: z.array(z.string()).min(1, { message: "Você deve selecionar pelo menos um participante (você mesmo)." }),
  guests: z.array(z.string()).optional().default([]),
  startTime: z.string({ required_error: "O horário de início é obrigatório."}),
  endTime: z.string({ required_error: "O horário de fim é obrigatório."}),
}).refine(data => (data.participants.length + (data.guests?.length ?? 0)) <= maxCapacity, {
    message: `O número total de participantes (membros + convidados) não pode exceder a capacidade da sala (${maxCapacity}).`,
    path: ["guests"],
});

interface BookingFormProps {
    room: Room;
    date: Date;
    allBookings: Booking[];
    onSuccess: (data: Omit<Booking, 'id' | 'status'>) => void;
    onCancel: () => void;
}

export function BookingForm({ room, date, allBookings, onSuccess, onCancel }: BookingFormProps) {
  const [user] = useAuthState(auth);
  const firestore = getFirestore(app);
  const usersRef = collection(firestore, 'users');
  const [allUsers, loadingUsers] = useCollectionData<User>(query(usersRef, orderBy("name")), { idField: 'id' });

  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const bookingFormSchema = createBookingFormSchema(room.capacity);
  type BookingFormValues = z.infer<typeof bookingFormSchema>;

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      participants: user ? [user.uid] : [],
      guests: [],
    },
  })

  const formattedDate = format(date, "PPP", { locale: ptBR });
  
  const { availableStartTimes, availableEndTimes } = useMemo(() => {
    const bookingsForDayAndRoom = allBookings.filter(b => 
        b.roomId === room.id && format(parseISO(b.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );

    const occupiedSlots = new Set<string>();
    bookingsForDayAndRoom.forEach(booking => {
        const start = parse(booking.startTime, 'HH:mm', date);
        const end = parse(booking.endTime, 'HH:mm', date);

        let current = start;
        while(isBefore(current, end)) {
            occupiedSlots.add(format(current, 'HH:mm'));
            current = addMinutes(current, 30);
        }
    });

    const allDaySlots = FIXED_SLOTS.flatMap(slot => {
        const baseTime = parse(slot, 'HH:mm', date);
        const slotsInBlock = slot === '23:00' ? 16 : 9; // 8h vs 4.5h
        return Array.from({length: slotsInBlock}, (_, i) => format(addMinutes(baseTime, i * 30), 'HH:mm'));
    });
    
    // Filtra horários de início que não estão ocupados
    const availableStarts = FIXED_SLOTS.filter(slot => !occupiedSlots.has(slot));

    let availableEnds: { value: string, label: string }[] = [];
    const selectedStartTime = form.watch("startTime");

    if (selectedStartTime) {
        const startIdx = allDaySlots.indexOf(selectedStartTime);
        if (startIdx !== -1) {
            // Encontra o próximo slot ocupado
            let nextOccupiedIdx = -1;
            for(let i = startIdx + 1; i < allDaySlots.length; i++) {
                if(occupiedSlots.has(allDaySlots[i])) {
                    nextOccupiedIdx = i;
                    break;
                }
            }
            
            // Define o fim do alcance possível
            const endOfRangeIdx = nextOccupiedIdx === -1 ? allDaySlots.length : nextOccupiedIdx;
            
            // Gera os horários de fim possíveis
            for(let i = startIdx; i < endOfRangeIdx; i++) {
                const slotTime = allDaySlots[i];
                const { endTime } = getBookingDurationAndEnd(slotTime);
                 // Adiciona apenas se for um horário final de um dos blocos fixos
                const isFixedEnd = FIXED_SLOTS.some(s => getBookingDurationAndEnd(s).endTime === endTime);
                if (isFixedEnd && !availableEnds.some(e => e.value === endTime)) {
                   availableEnds.push({ value: endTime, label: endTime });
                }
            }
        }
    }
    
    return { availableStartTimes: availableStarts, availableEndTimes: availableEnds };
  }, [room.id, date, allBookings, form.watch("startTime")]);


  const handleNextStep = async () => {
    const isValid = await form.trigger(["title", "description", "startTime", "endTime"]);
    if (isValid) {
        setStep(2);
    }
  }
  
  function onSubmit(data: BookingFormValues) {
    if (!user) return;
    
    const newBooking = {
        title: data.title,
        description: data.description || null,
        participants: data.participants,
        guests: data.guests || [],
        roomId: room.id,
        organizerId: user.uid,
        date: format(date, "yyyy-MM-dd"),
        startTime: data.startTime,
        endTime: data.endTime,
    };
    
    onSuccess(newBooking as any);
  }

  const totalParticipants = (form.watch("participants")?.length || 0) + (form.watch("guests")?.length || 0);
  
  const { potentialGuests, filteredUsers } = useMemo(() => {
    if (!allUsers) return { potentialGuests: [], filteredUsers: [] };
    
    const guests = allUsers.filter(u => u.status !== 'Ativo' || u.category === 'Visitante');
    const active = allUsers.filter(u => u.status === 'Ativo' && u.category !== 'Visitante');
    
    // A ordem é importante para o visual: membros ativos primeiro.
    const combinedList = [...active, ...guests];

    const filtered = searchTerm
        ? combinedList.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : combinedList;

    return { potentialGuests: guests, filteredUsers: filtered };
  }, [allUsers, searchTerm]);


  const handleUserToggle = (toggledUser: User) => {
    const isGuest = potentialGuests.some(g => g.uid === toggledUser.uid);
    const field = isGuest ? "guests" : "participants";
    const currentValues = form.getValues(field);

    const newValues = currentValues.includes(toggledUser.uid)
        ? currentValues.filter(uid => uid !== toggledUser.uid)
        : [...currentValues, toggledUser.uid];

    // O organizador (usuário logado) não pode ser desmarcado da lista de participantes.
    if (field === "participants" && toggledUser.uid === user?.uid) {
        return;
    }

    form.setValue(field, newValues, { shouldValidate: true });
  };


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
        </div>

        {step === 1 && (
            <div className="space-y-4">
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
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Horário de Início</FormLabel>
                            <Select onValueChange={(value) => {
                                field.onChange(value);
                                form.setValue('endTime', ''); // Reseta o horário de fim ao mudar o início
                            }} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {availableStartTimes.map(time => (
                                        <SelectItem key={time} value={time}>{time}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Horário de Fim</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!form.watch("startTime")}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {availableEndTimes.map(time => (
                                        <SelectItem key={time.value} value={time.value}>{time.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
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
          </div>
        )}

        {step === 2 && (
            <div className="space-y-4">
                {loadingUsers ? <Skeleton className="h-40 w-full" /> : (
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
                    <FormMessage />
                </div>
                )}
                
                {form.formState.errors.guests?.message && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {form.formState.errors.guests.message}
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        )}
        
        <DialogFooter>
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
            {step === 1 && <Button type="button" onClick={handleNextStep}>Avançar</Button>}
            {step === 2 && (
                <>
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>Voltar</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting || loadingUsers}>
                        {form.formState.isSubmitting ? "Confirmando..." : "Confirmar Reserva"}
                    </Button>
                </>
            )}
        </DialogFooter>
      </form>
    </Form>
  )
}

    