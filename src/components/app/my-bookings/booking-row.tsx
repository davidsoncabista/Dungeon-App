
"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import type { Booking } from "@/lib/types/booking"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Clock, Users, Eye } from "lucide-react"
import { useDocumentData } from "react-firebase-hooks/firestore"
import { doc, getFirestore } from "firebase/firestore"
import { app } from "@/lib/firebase"
import { Skeleton } from "@/components/ui/skeleton"
import type { Room } from "@/lib/types/room"

export const BookingRow = ({ booking }: { booking: Booking }) => {
    const firestore = getFirestore(app);
    const roomRef = doc(firestore, 'rooms', booking.roomId);
    const [room, loadingRoom] = useDocumentData<Room>(roomRef);

    const formattedDate = format(parseISO(`${booking.date}T00:00:00`), "dd/MM/yyyy", { locale: ptBR });
    const totalParticipants = booking.participants.length + (booking.guests?.length ?? 0);
    
    const statusVariant: { [key: string]: "secondary" | "destructive" | "outline" } = {
        'Confirmada': 'secondary',
        'Cancelada': 'destructive',
        'Pendente': 'outline'
    }
    
    if (loadingRoom) {
        return (
             <TableRow>
                <TableCell colSpan={5}>
                    <Skeleton className="h-16 w-full" />
                </TableCell>
            </TableRow>
        )
    }

    return (
      <TableRow>
        <TableCell>
            <div className="font-medium">{room?.name || "Sala não encontrada"}</div>
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
