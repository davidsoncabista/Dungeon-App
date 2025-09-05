"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { getRooms, getUsers } from "@/lib/mock-service"
import { CalendarIcon, Clock, Users, Plus, Minus } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"

export default function BookRoomPage() {
  const rooms = getRooms().filter(r => r.status === "Disponível");
  const users = getUsers();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [participants, setParticipants] = useState<string[]>([]);
  const [guests, setGuests] = useState(0);

  const handleParticipantChange = (userId: string) => {
    setParticipants(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Reservar Sala</h1>
        <p className="text-muted-foreground">Preencha os detalhes para agendar sua próxima sessão.</p>
      </div>

      <form className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Reserva</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="room">Sala</Label>
                <Select>
                  <SelectTrigger id="room" aria-label="Selecionar Sala">
                    <SelectValue placeholder="Selecione a sala desejada" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map(room => (
                      <SelectItem key={room.id} value={room.id}>{room.name} (Capacidade: {room.capacity})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                  <div className="grid gap-3 md:col-span-1">
                    <Label htmlFor="date">Data</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date"
                          variant={"outline"}
                          className={cn(
                            "justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "dd/MM/yyyy") : <span>Escolha uma data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-3">
                      <Label htmlFor="startTime">Início</Label>
                      <Input id="startTime" type="time" defaultValue="19:00" />
                  </div>
                  <div className="grid gap-3">
                      <Label htmlFor="endTime">Fim</Label>
                      <Input id="endTime" type="time" defaultValue="23:00" />
                  </div>
              </div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
                <CardTitle>Confirmação</CardTitle>
                <CardDescription>Verifique os detalhes e confirme sua reserva.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button size="lg" className="w-full">Confirmar Reserva</Button>
            </CardContent>
           </Card>
        </div>
        
        <div className="lg:col-span-1 grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Participantes</CardTitle>
                    <CardDescription>Convide membros para sua sessão.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {users.map(user => (
                            <div key={user.id} className="flex items-center justify-between">
                                <Label htmlFor={`user-${user.id}`} className="flex items-center gap-2 font-normal">
                                    <Checkbox 
                                        id={`user-${user.id}`}
                                        onCheckedChange={() => handleParticipantChange(user.id)}
                                        checked={participants.includes(user.id)}
                                    />
                                    {user.name}
                                </Label>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Convidados</CardTitle>
                    <CardDescription>Adicione convidados não-associados.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                    <Label htmlFor="guests">Número de convidados</Label>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="icon" onClick={() => setGuests(Math.max(0, guests - 1))}><Minus className="h-4 w-4" /></Button>
                        <Input id="guests" type="number" value={guests} readOnly className="w-16 text-center" />
                        <Button type="button" variant="outline" size="icon" onClick={() => setGuests(guests + 1)}><Plus className="h-4 w-4" /></Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </form>
    </div>
  )
}
