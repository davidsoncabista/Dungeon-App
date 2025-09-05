import { MoreHorizontal, PlusCircle, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Image from "next/image"
import { getRooms } from "@/lib/mock-service"

export default function RoomsPage() {
  const rooms = getRooms();

  return (
    <div className="grid gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Gerenciamento de Salas</h1>
          <p className="text-muted-foreground">Crie, edite e gerencie as salas de jogo.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Sala
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Salas de Jogo</CardTitle>
          <CardDescription>Uma lista de todas as salas disponíveis na associação.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Imagem</span>
                </TableHead>
                <TableHead>Nome da Sala</TableHead>
                <TableHead>Capacidade</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map(room => (
                <TableRow key={room.id}>
                  <TableCell className="hidden sm:table-cell">
                    {room.image && (
                        <Image
                        alt={room.name}
                        className="aspect-video rounded-md object-cover"
                        height="64"
                        src={room.image}
                        width="128"
                        data-ai-hint="rpg room"
                        />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {room.name}
                    <p className="text-sm text-muted-foreground md:hidden">{room.description}</p>
                  </TableCell>
                  <TableCell>{room.capacity} pessoas</TableCell>
                  <TableCell className="hidden md:table-cell">
                  <Badge variant={room.status === 'Disponível' ? 'secondary' : room.status === 'Ocupada' ? 'outline' : 'destructive'} className={room.status === 'Disponível' ? 'bg-green-100 text-green-800' : ''}>
                      {room.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" />Editar Sala</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" />Excluir Sala</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
