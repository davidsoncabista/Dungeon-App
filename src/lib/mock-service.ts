import type { User } from './types/user';
import type { Room } from './types/room';
import type { Booking } from './types/booking';
import type { Notice } from './types/notice';
import type { Transaction } from './types/transaction';

// --- USERS ---
const users: User[] = [
  { id: 'usr_admin', name: "Aventureiro Mestre", email: "admin@adbelem.com", category: "Master", status: "Ativo", role: "Administrador", avatar: "https://picsum.photos/seed/admin/100/100" },
  { id: 'usr_gandalf', name: "Gandalf, o Cinzento", email: "gandalf@istari.com", category: "Master", status: "Ativo", avatar: "https://picsum.photos/seed/gandalf/40/40" },
  { id: 'usr_frodo', name: "Frodo Bolseiro", email: "frodo@shire.com", category: "Gamer", status: "Ativo", avatar: "https://picsum.photos/seed/frodo/40/40" },
  { id: 'usr_aragorn', name: "Aragorn, filho de Arathorn", email: "aragorn@gondor.com", category: "Player", status: "Pendente", avatar: "https://picsum.photos/seed/aragorn/40/40" },
  { id: 'usr_legolas', name: "Legolas Greenleaf", email: "legolas@mirkwood.com", category: "Gamer", status: "Ativo", avatar: "https://picsum.photos/seed/legolas/40/40" },
  { id: 'usr_saruman', name: "Saruman, o Branco", email: "saruman@isengard.com", category: "Master", status: "Bloqueado", avatar: "https://picsum.photos/seed/saruman/40/40" },
];

export const getAuthenticatedUser = (): User => {
    return users.find(u => u.id === 'usr_admin')!;
}
export const getUsers = (): User[] => users;
export const getUserById = (id: string): User | undefined => users.find(u => u.id === id);


// --- ROOMS ---
const rooms: Room[] = [
  { id: 'room_ghalmaraz', name: "Sala Ghal-Maraz", capacity: 8, status: "Disponível", description: "Sala temática de fantasia medieval.", image: "https://picsum.photos/seed/ghalmaraz/200/100" },
  { id: 'room_conselho', name: "Sala do Conselho", capacity: 12, status: "Em Manutenção", description: "Sala ampla para grandes grupos e eventos.", image: "https://picsum.photos/seed/conselho/200/100" },
  { id: 'room_arena', name: "Arena Imperial", capacity: 6, status: "Disponível", description: "Sala com temática de ficção científica.", image: "https://picsum.photos/seed/arena/200/100" },
  { id: 'room_taverna', name: "Taverna do Anão", capacity: 4, status: "Ocupada", description: "Sala aconchegante para jogos de cartas.", image: "https://picsum.photos/seed/taverna/200/100" },
];

export const getRooms = (): Room[] => rooms;
export const getRoomById = (id: string): Room | undefined => rooms.find(r => r.id === id);

// --- BOOKINGS ---
const bookings: Booking[] = [
  { 
    id: 'booking_1', 
    roomId: 'room_ghalmaraz', 
    organizerId: 'usr_admin', 
    date: '2024-09-25', 
    startTime: '19:00', 
    endTime: '23:00', 
    participants: [
        getUserById('usr_admin')!,
        getUserById('usr_frodo')!,
        getUserById('usr_gandalf')!,
    ],
    guests: 1,
    status: 'Confirmada'
  },
  { 
    id: 'booking_2', 
    roomId: 'room_arena', 
    organizerId: 'usr_admin', 
    date: '2024-09-28', 
    startTime: '18:00', 
    endTime: '22:00', 
    participants: [
        getUserById('usr_admin')!,
        getUserById('usr_aragorn')!,
        getUserById('usr_legolas')!,
        getUserById('usr_frodo')!,
    ],
    guests: 2,
    status: 'Confirmada'
  },
  { 
    id: 'booking_3', 
    roomId: 'room_taverna', 
    organizerId: 'usr_frodo', 
    date: '2024-08-15', 
    startTime: '20:00', 
    endTime: '23:30', 
    participants: [
        getUserById('usr_frodo')!,
        getUserById('usr_legolas')!,
    ],
    guests: 0,
    status: 'Confirmada'
  },
];
export const getBookings = (): Booking[] => bookings;

// --- NOTICES ---
const notices: Notice[] = [
    {
        id: 'notice_1',
        title: 'Novo Horário Corujão!',
        description: "A partir da próxima semana, teremos um novo horário de funcionamento 'Corujão' nas sextas e sábados, das 00:00 às 06:00.",
        link: '#',
        createdAt: '2024-09-01T10:00:00Z',
    }
];

export const getNotices = (): Notice[] => notices;

// --- TRANSACTIONS ---
const transactions: Transaction[] = [
  { id: "TRX001", date: "01/09/2024", description: "Mensalidade Setembro/24", amount: "R$ 50,00", status: "Pago" },
  { id: "TRX002", date: "15/08/2024", description: "Convidado extra", amount: "R$ 15,00", status: "Pago" },
  { id: "TRX003", date: "01/08/2024", description: "Mensalidade Agosto/24", amount: "R$ 50,00", status: "Pago" },
  { id: "TRX004", date: "01/07/2024", description: "Mensalidade Julho/24", amount: "R$ 50,00", status: "Pago" },
];

export const getTransactions = (): Transaction[] => transactions;
