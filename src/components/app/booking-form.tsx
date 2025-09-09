
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
import { format, parseISO, parse, isBefore, addMinutes, getHours, getMinutes, set } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getBookingDurationAndEnd, FIXED_SLOTS } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DialogFooter } from "@/components/ui/dialog"
import { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const allUsers = getUsers();
const currentUser = getAuthenticatedUser();

const createBookingFormSchema = (maxCapacity: number) => z.object({
  title: z.string().min(3, { message: "O título deve ter pelo menos 3 caracteres." }).max(50, { message: "O título não pode ter mais de 50 caracteres."}),
  description: z.string().max(200, {message: "A descrição não pode ter mais de 200 caracteres."}).optional(),
  participants: z.array(z.string()).min(1, { message: "Você deve selecionar pelo menos um participante (você mesmo)." }),
  guests: z.coerce.number().int().min(0, {message: "O número de convidados não pode ser negativo."}).optional().default(0),
  startTime: z.string({ required_error: "O horário de início é obrigatório."}),
  endTime: z.string({ required_error: "O horário de fim é obrigatório."}),
}).refine(data => (data.participants.length + (data.guests ?? 0)) <= maxCapacity, {
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
  const [step, setStep] = useState(1);
  const bookingFormSchema = createBookingFormSchema(room.capacity);
  type BookingFormValues = z.infer<typeof bookingFormSchema>;

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      participants: [currentUser.id],
      guests: 0,
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
    const participantDetails = data.participants.map(id => allUsers.find(u => u.id === id)).filter(Boolean) as any[];
    
    const newBooking = {
        title: data.title,
        description: data.description,
        participants: participantDetails,
        guests: data.guests,
        roomId: room.id,
        organizerId: currentUser.id,
        date: format(date, "yyyy-MM-dd"),
        startTime: data.startTime,
        endTime: data.endTime,
    };
    
    onSuccess(newBooking);
  }

  const totalParticipants = (form.watch("participants")?.length || 0) + (form.watch("guests") || 0);

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
                
                {form.formState.errors.guests?.message && !form.formState.errors.guests.ref && (
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
                    <Button type="submit">Confirmar Reserva</Button>
                </>
            )}
        </DialogFooter>
      </form>
    </Form>
  )
}

    