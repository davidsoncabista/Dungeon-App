
"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Clock, PlusCircle, Users } from "lucide-react"
import { BookingDetailsModal } from "./booking-details-modal"
import { BookingModal } from "./booking-modal"
import type { Booking } from "@/lib/types/booking"
import type { Room } from "@/lib/types/room"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const BOOKING_COLORS = ["bg-blue-300/70", "bg-purple-300/70", "bg-green-300/70", "bg-yellow-300/70"];

// --- Componente da Agenda (Acordeão - Mobile/Portrait) ---
export const AccordionScheduleView = ({ rooms, bookings, selectedDate, setModalOpen, allBookings, canBook }: { rooms: Room[], bookings: Booking[], selectedDate: Date, setModalOpen: (open: boolean) => void, allBookings: Booking[], canBook: boolean | undefined }) => {
    return (
        <Accordion type="multiple" className="w-full space-y-2">
            {rooms.map((room, roomIndex) => {
                const roomBookings = bookings.filter(b => b.roomId === room.id).sort((a,b) => a.startTime.localeCompare(b.startTime));
                const colorClass = BOOKING_COLORS[roomIndex % BOOKING_COLORS.length];

                return (
                    <AccordionItem key={room.id} value={room.id} className="border rounded-lg px-4 bg-background">
                        <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-2">
                                <div className={cn("w-3 h-3 rounded-full", colorClass)}></div>
                                <span className="font-bold">{room.name}</span>
                                <Badge variant="outline">{roomBookings.length} reserva(s)</Badge>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4 pt-2">
                                {roomBookings.length > 0 ? (
                                    roomBookings.map(booking => (
                                        <BookingDetailsModal key={booking.id} booking={booking} onOpenChange={setModalOpen}>
                                            <div className="p-3 rounded-md border cursor-pointer hover:bg-muted/50">
                                                <p className="font-semibold">{booking.title || 'Reserva Rápida'}</p>
                                                <p className="text-sm text-muted-foreground"><Clock className="inline h-3 w-3 mr-1"/>{booking.startTime} - {booking.endTime}</p>
                                                <p className="text-sm text-muted-foreground"><Users className="inline h-3 w-3 mr-1"/>{booking.participants.length + (booking.guests || 0)} participante(s)</p>
                                            </div>
                                        </BookingDetailsModal>
                                    ))
                                ) : (
                                    <p className="text-sm text-center text-muted-foreground py-4">Nenhuma reserva para esta sala hoje.</p>
                                )}
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="w-full">
                                                <BookingModal room={room} date={selectedDate} onOpenChange={setModalOpen} allBookings={allBookings}>
                                                    <Button className="w-full mt-2" disabled={!canBook}>
                                                        <PlusCircle className="mr-2 h-4 w-4" />
                                                        Reservar {room.name}
                                                    </Button>
                                                </BookingModal>
                                            </div>
                                        </TooltipTrigger>
                                        {!canBook && (
                                            <TooltipContent>
                                                <p>Apenas membros ativos podem fazer reservas.</p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )
            })}
        </Accordion>
    )
}

    