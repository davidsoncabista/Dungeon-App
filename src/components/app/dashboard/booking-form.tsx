
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
import { Users, Calendar, AlertCircle, Search, CalendarIcon } from "lucide-react/dist/esm/icons";
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Room } from "@/lib/types/room"
import type { Booking } from "@/lib/types/booking"
import { format, parse, isBefore, addMinutes, addDays, getWeek, getMonth, getYear, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getBookingDurationAndEnd, FIXED_SLOTS } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DialogFooter } from "@/components/ui/dialog"
import { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, app } from "@/lib/firebase"
import { getFirestore, collection, query, orderBy, where } from "firebase/firestore"
import { useCollectionData } from "react-firebase-hooks/firestore"
import type { User } from "@/lib/types/user"
import type { Plan } from "@/lib/types/plan"
import { Skeleton } from "../ui/skeleton"
import { ScrollArea } from "../ui/scroll-area"
import { Checkbox } from "../ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Calendar as CalendarPicker } from "../ui/calendar"


const createBookingFormSchema = (
  allRooms: Room[] = [],
  allUserBookings: Booking[] = [],
  userPlan: Plan | undefined,
  userId: string | undefined
) => z.object({
  date: z.date({ required_error: "A data da reserva é obrigatória." }),
  roomId: z.string({ required_error: "Você deve selecionar uma sala." }),
  title: z.string().min(3, { message: "O título deve ter pelo menos 3 caracteres." }).max(50, { message: "O título não pode ter mais de 50 caracteres."}),
  description: z.string().max(200, {message: "A descrição não pode ter mais de 200 caracteres."}).optional(),
  participants: z.array(z.string()).min(1, { message: "Você deve selecionar pelo menos um participante (você mesmo)." }),
  guests: z.array(z.string()).optional().default([]),
  startTime: z.string({ required_error: "O horário de início é obrigatório."}),
  endTime: z.string({ required_error: "O horário de fim é obrigatório."}),
}).superRefine((data, ctx) => {
    // 1. Validação de capacidade da sala
    const selectedRoom = allRooms.find(r => r.id === data.roomId);
    if (selectedRoom) {
        const totalParticipants = data.participants.length + (data.guests?.length ?? 0);
        if (totalParticipants > selectedRoom.capacity) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `O número total de participantes (${totalParticipants}) não pode exceder a capacidade da sala (${selectedRoom.capacity}).`,
                path: ["guests"], 
            });
        }
    }

    // 2. Validação de cotas (Apenas para o organizador)
    if (userPlan && allUserBookings && userId) {
        const bookingDate = data.date;

        // Filtra apenas as reservas organizadas pelo usuário atual
        const organizedBookings = allUserBookings.filter(b => b.organizerId === userId);

        // --- CÁLCULO DE USO ---
        const startOfBookingWeek = startOfWeek(bookingDate, { weekStartsOn: 1 });
        const endOfBookingWeek = endOfWeek(bookingDate, { weekStartsOn: 1 });
        const startOfBookingMonth = startOfMonth(bookingDate);
        const endOfBookingMonth = endOfMonth(bookingDate);

        // Contagem para o período relevante
        const weeklyBookings = organizedBookings.filter(b => {
            const d = parse(b.date, 'yyyy-MM-dd', new Date());
            return d >= startOfBookingWeek && d <= endOfBookingWeek;
        }).length;

        const monthlyBookings = organizedBookings.filter(b => {
            const d = parse(b.date, 'yyyy-MM-dd', new Date());
            return d >= startOfBookingMonth && d <= endOfBookingMonth;
        }).length;

        const corujaoBookings = organizedBookings.filter(b => {
            const d = parse(b.date, 'yyyy-MM-dd', new Date());
            return b.startTime === '23:00' && d >= startOfBookingMonth && d <= endOfBookingMonth;
        }).length;
        
        // --- VALIDAÇÕES ---
        if (userPlan.weeklyQuota > 0 && weeklyBookings >= userPlan.weeklyQuota) {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Você atingiu sua cota de ${userPlan.weeklyQuota} reserva(s) semanal(is).`,
                path: ["date"],
            });
        }
        
        if (userPlan.monthlyQuota > 0 && monthlyBookings >= userPlan.monthlyQuota) {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Você atingiu sua cota de ${userPlan.monthlyQuota} reserva(s) mensal(is).`,
                path: ["date"],
            });
        }
        
        if (data.startTime === '23:00' && userPlan.corujaoQuota > 0 && corujaoBookings >= userPlan.corujaoQuota) {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Você atingiu sua cota de ${userPlan.corujaoQuota} reserva(s) Corujão neste mês.`,
                path: ["startTime"],
            });
        }
    }
});


type BookingFormValues = z.infer<ReturnType<typeof createBookingFormSchema>>;

interface BookingFormProps {
    initialDate: Date;
    allBookings: Booking[];
    onSuccess: (data: Omit<Booking, 'id' | 'status'>) => void;
    onCancel: () => void;
}

export function BookingForm({ initialDate, allBookings, onSuccess, onCancel }: BookingFormProps) {
  const [user] = useAuthState(auth);
  const firestore = getFirestore(app);

  // --- Buscas no Firestore ---
  const roomsRef = collection(firestore, 'rooms');
  const [allRooms, loadingRooms] = useCollectionData<Room>(query(roomsRef, orderBy("name")), { idField: 'id' });
  const availableRooms = allRooms?.filter(r => r.status === 'Disponível');

  const usersRef = collection(firestore, 'users');
  const [allUsers, loadingUsers] = useCollectionData<User>(query(usersRef, orderBy("name")), { idField: 'id' });
  const currentUser = allUsers?.find(u => u.uid === user?.uid);

  const plansRef = collection(firestore, 'plans');
  const [plans, loadingPlans] = useCollectionData<Plan>(plansRef, { idField: 'id' });
  const userPlan = plans?.find(p => p.name === currentUser?.category);
  
  // Busca todas as reservas para validar cotas corretamente
  const [allUserBookings, loadingUserBookings] = useCollectionData<Booking>(collection(firestore, 'bookings'));

  // --- State do formulário ---
  const [step, setStep] = useState(0);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [guestSearchTerm, setGuestSearchTerm] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const formSchema = useMemo(() => createBookingFormSchema(allRooms || [], allUserBookings || [], userPlan, user?.uid), [allRooms, allUserBookings, userPlan, user]);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      date: initialDate,
      roomId: "",
      title: "",
      description: "",
      participants: user ? [user.uid] : [],
      guests: [],
      startTime: "",
      endTime: "",
    },
  });

  const selectedRoomId = form.watch('roomId');
  const selectedDate = form.watch('date');
  const selectedRoom = useMemo(() => allRooms?.find(r => r.id === selectedRoomId), [allRooms, selectedRoomId]);
  
  const { availableStartTimes, availableEndTimes } = useMemo(() => {
    const selectedRoomId = form.watch('roomId');
    const selectedDate = form.watch('date');
    if (!selectedRoomId || !selectedDate) return { availableStartTimes: [], availableEndTimes: [] };

    const bookingsForDayAndRoom = allBookings.filter(b => 
        b.roomId === selectedRoomId && b.date === format(selectedDate, "yyyy-MM-dd")
    );

    const occupiedSlots = new Set<string>();
    bookingsForDayAndRoom.forEach(booking => {
        const start = parse(booking.startTime, 'HH:mm', selectedDate);
        let end = parse(booking.endTime, 'HH:mm', selectedDate);
        if (isBefore(end, start)) { // Corujão
            end = addDays(end, 1);
        }

        let current = start;
        while(isBefore(current, end)) {
            occupiedSlots.add(format(current, 'HH:mm'));
            current = addMinutes(current, 30);
        }
    });

    const allDaySlots = FIXED_SLOTS.flatMap(slot => {
        const baseTime = parse(slot, 'HH:mm', selectedDate);
        const slotsInBlock = slot === '23:00' ? 16 : 9; // 8h vs 4.5h
        return Array.from({length: slotsInBlock}, (_, i) => format(addMinutes(baseTime, i * 30), 'HH:mm'));
    });
    
    const availableStarts = FIXED_SLOTS.filter(slot => !occupiedSlots.has(slot));

    let availableEnds: { value: string, label: string }[] = [];
    const selectedStartTime = form.watch("startTime");

    if (selectedStartTime) {
        const startIdx = allDaySlots.indexOf(selectedStartTime);
        if (startIdx !== -1) {
            let nextOccupiedIdx = -1;
            for(let i = startIdx + 1; i < allDaySlots.length; i++) {
                if(occupiedSlots.has(allDaySlots[i])) {
                    nextOccupiedIdx = i;
                    break;
                }
            }
            
            const endOfRangeIdx = nextOccupiedIdx === -1 ? allDaySlots.length : nextOccupiedIdx;
            
            for(let i = startIdx; i < endOfRangeIdx; i++) {
                const slotTime = allDaySlots[i];
                const { endTime } = getBookingDurationAndEnd(slotTime);
                const isFixedEnd = FIXED_SLOTS.some(s => getBookingDurationAndEnd(s).endTime === endTime);
                if (isFixedEnd && !availableEnds.some(e => e.value === endTime)) {
                   availableEnds.push({ value: endTime, label: endTime });
                }
            }
        }
    }
    
    return { availableStartTimes: availableStarts, availableEndTimes: availableEnds };
  }, [form.watch("roomId"), form.watch("date"), allBookings, form.watch("startTime")]);


  const handleNextStep = async () => {
    let fieldsToValidate: (keyof BookingFormValues)[] = [];
    switch (step) {
        case 0: fieldsToValidate = ["date", "roomId"]; break;
        case 1: fieldsToValidate = ["title", "startTime", "endTime", "date"]; break; // Re-valida a data por causa das cotas
        case 2: fieldsToValidate = ["participants", "date"]; break; // Adiciona date para revalidar cotas
        case 3: fieldsToValidate = ["participants", "guests", "date"]; break; // Adiciona date para revalidar cotas
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
        setStep(step + 1);
    }
  }
  
  function onSubmit(data: BookingFormValues) {
    if (!user) return;
    
    const newBooking = {
        ...data,
        organizerId: user.uid,
        date: format(data.date, "yyyy-MM-dd"),
    };
    
    onSuccess(newBooking as any);
  }

  const totalParticipants = (form.watch("participants")?.length || 0) + (form.watch("guests")?.length || 0);
  
  const { activeMembers, inactiveOrVisitors } = useMemo(() => {
    if (!allUsers) return { activeMembers: [], inactiveOrVisitors: [] };
    
    const active = allUsers.filter(u => u.status === 'Ativo' && u.category !== 'Visitante' && u.uid !== user?.uid);
    const organizer = allUsers.find(u => u.uid === user?.uid);
    if(organizer) active.unshift(organizer);

    const inactive = allUsers.filter(u => u.status !== 'Ativo' || u.category === 'Visitante');
    return { activeMembers: active, inactiveOrVisitors: inactive };
  }, [allUsers, user]);

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


  const handleToggle = (userId: string, isGuest: boolean) => {
      const field = isGuest ? "guests" : "participants";
      const currentValues = form.getValues(field) || [];
      const newValues = currentValues.includes(userId)
          ? currentValues.filter(id => id !== userId)
          : [...currentValues, userId];
      
      if (!isGuest && userId === user?.uid) return;

      form.setValue(field, newValues, { shouldValidate: true });
  };

  const isLoading = loadingRooms || loadingUsers || loadingPlans || loadingUserBookings;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2 border-b pb-4 mb-4">
            <div className="flex items-center gap-4 text-sm flex-wrap">
                 {selectedRoom && (
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                            Capacidade: {totalParticipants} / {selectedRoom.capacity}
                        </span>
                    </div>
                )}
            </div>
        </div>

        {step === 0 && (
            <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
                 <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel className="text-base font-semibold">Data da Reserva</FormLabel>
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP", { locale: ptBR })
                                ) : (
                                    <span>Escolha uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <CalendarPicker
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => {
                                    if(date) {
                                      field.onChange(date);
                                      form.reset({
                                        ...form.getValues(),
                                        date,
                                        startTime: '',
                                        endTime: ''
                                      });
                                      setIsCalendarOpen(false);
                                    }
                                }}
                                fromDate={new Date()}
                                toDate={addDays(new Date(), 14)}
                                disabled={(date) => isBefore(date, startOfDay(new Date()))}
                                initialFocus
                                locale={ptBR}
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="roomId"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel className="text-base font-semibold">Sala</FormLabel>
                            {loadingRooms ? <Skeleton className="h-10 w-full" /> : (
                                 <Select onValueChange={(value) => {
                                        field.onChange(value);
                                        form.reset({
                                            ...form.getValues(),
                                            roomId: value,
                                            startTime: '',
                                            endTime: ''
                                        });
                                    }}
                                    value={field.value}
                                    >
                                     <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione uma sala..." />
                                        </SelectTrigger>
                                     </FormControl>
                                     <SelectContent>
                                        {(availableRooms || []).map(room => (
                                            <SelectItem key={room.id} value={room.id}>
                                                {room.name} (Cap. {room.capacity})
                                            </SelectItem>
                                        ))}
                                     </SelectContent>
                                 </Select>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        )}

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
                                  form.setValue('endTime', '');
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
               {form.formState.errors.date && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {form.formState.errors.date.message}
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        )}

        {step === 2 && (
            <div className="space-y-4">
                {isLoading ? <Skeleton className="h-40 w-full" /> : (
                  <div className="space-y-2">
                    <FormLabel>Membros Ativos</FormLabel>
                    <FormDescription>Selecione os membros que participarão.</FormDescription>
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar por nome ou apelido..." className="pl-9" value={memberSearchTerm} onChange={(e) => setMemberSearchTerm(e.target.value)} />
                    </div>
                    <ScrollArea className="h-48 rounded-md border">
                        <div className="p-4 space-y-1">
                            {filteredMembers.map(u => (
                                <div key={u.uid} className="flex items-center space-x-3 p-2 rounded-md">
                                    <Checkbox 
                                        id={`member-${u.uid}`} 
                                        checked={form.watch('participants').includes(u.uid)} 
                                        onCheckedChange={() => handleToggle(u.uid, false)} 
                                        disabled={u.uid === user?.uid} 
                                    />
                                    <label htmlFor={`member-${u.uid}`} className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                        {u.name} {u.nickname && `(${u.nickname})`}
                                    </label>
                                </div>
                            ))}
                            {filteredMembers.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">Nenhum membro encontrado.</p>}
                        </div>
                    </ScrollArea>
                    <FormMessage />
                </div>
                )}
            </div>
        )}

        {step === 3 && (
            <div className="space-y-4">
                {isLoading ? <Skeleton className="h-40 w-full" /> : (
                  <div className="space-y-2">
                    <FormLabel>Convidados (Visitantes e Não-Ativos)</FormLabel>
                    <FormDescription>Selecione os convidados para a sessão. Uma taxa pode ser aplicada para convidados extras.</FormDescription>
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar por nome ou apelido..." className="pl-9" value={guestSearchTerm} onChange={(e) => setGuestSearchTerm(e.target.value)} />
                    </div>
                    <ScrollArea className="h-48 rounded-md border">
                        <div className="p-4 space-y-1">
                            {filteredGuests.map(u => (
                                <div key={u.uid} className="flex items-center space-x-3 p-2 rounded-md">
                                    <Checkbox 
                                        id={`guest-${u.uid}`} 
                                        checked={(form.watch('guests') || []).includes(u.uid)} 
                                        onCheckedChange={() => handleToggle(u.uid, true)} 
                                    />
                                    <label htmlFor={`guest-${u.uid}`} className="flex-1 text-sm font-medium leading-none cursor-pointer opacity-75">
                                        {u.name} {u.nickname && `(${u.nickname})`}
                                    </label>
                                    <Badge variant="outline">{u.category}</Badge>
                                </div>
                            ))}
                            {filteredGuests.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">Nenhum convidado encontrado.</p>}
                        </div>
                    </ScrollArea>
                    <FormMessage />
                </div>
                )}
                
                {form.formState.errors.guests && (
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
            {step === 0 && 
                <>
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                    <Button type="button" onClick={handleNextStep} disabled={!selectedRoomId || isLoading}>Avançar</Button>
                </>
            }
            {step > 0 && 
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>Voltar</Button>
            }
            {step === 1 && 
                <Button type="button" onClick={handleNextStep} disabled={isLoading}>Adicionar Membros</Button>
            }
             {step === 2 && 
                <Button type="button" onClick={handleNextStep} disabled={isLoading}>Adicionar Convidados</Button>
            }
            {step === 3 && (
                <Button type="submit" disabled={form.formState.isSubmitting || isLoading || !form.formState.isValid}>
                    {form.formState.isSubmitting ? "Confirmando..." : "Confirmar Reserva"}
                </Button>
            )}
        </DialogFooter>
      </form>
    </Form>
  )
}
