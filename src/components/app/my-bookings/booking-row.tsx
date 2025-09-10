
"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import { getRoomById } from "@/lib/mock-service"
import type { Booking } from "@/lib/types/booking"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Clock, Users, Eye } from "lucide-react"

export const BookingRow = ({ booking }: { booking: Booking }) => {
    const room = getRoomById(booking.roomId);
    const formattedDate = format(parseISO(`${booking.date}T00:00:00`), "dd/MM/yyyy", { locale: ptBR });
    const totalParticipants = booking.participants.length + (booking.guests ?? 0);
    
    const statusVariant: { [key: string]: "secondary" | "destructive" | "outline" } = {
        'Confirmada': 'secondary',
        'Cancelada': 'destructive',
        'Pendente': 'outline'
    }

    return (
      <TableRow>
        <TableCell>
            <div className="font-medium">{room?.name}</div>
            <div className="text-sm text-muted-foreground">{formattedDate}</div>
        </TableCell>
        <TableCell className="hidden md:table-cell">
            <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground"/>
                <span>{booking.startTime} - {booking.endTime}</span>
            </div>
        </TableCell>
        <TableCell className="hidden lg:table-cell">
        <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground"/>
                <span>{totalParticipants} participante(s)</span>
            </div>
        </TableCell>
        <TableCell>
          <Badge variant={statusVariant[booking.status] || 'default'} className={booking.status === 'Confirmada' ? 'bg-green-100 text-green-800' : ''}>
            {booking.status}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <Button variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            Detalhes
          </Button>
        </TableCell>
      </TableRow>
    );
};
