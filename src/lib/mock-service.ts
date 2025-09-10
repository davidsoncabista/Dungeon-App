
import type { User } from './types/user';
import type { Room } from './types/room';
import type { Booking } from './types/booking';
import type { Notice } from './types/notice';
import type { Transaction } from './types/transaction';
import { auth } from './firebase';

// --- USERS ---
const users: User[] = [
  { id: 'usr_admin', name: "Aventureiro Mestre", email: "admin@adbelem.com", category: "Master", status: "Ativo", role: "Administrador", avatar: "https://picsum.photos/seed/admin/100/100" },
  { id: 'usr_gandalf', name: "Gandalf, o Cinzento", email: "gandalf@istari.com", category: "Master", status: "Ativo", role: "Editor", avatar: "https://picsum.photos/seed/gandalf/40/40" },
  { id: 'usr_frodo', name: "Frodo Bolseiro", email: "frodo@shire.com", category: "Gamer", status: "Ativo", avatar: "https://picsum.photos/seed/frodo/40/40" },
  { id: 'usr_aragorn', name: "Aragorn, filho de Arathorn", email: "aragorn@gondor.com", category: "Player", status: "Pendente", role: "Revisor", avatar: "https://picsum.photos/seed/aragorn/40/40" },
  { id: 'usr_legolas', name: "Legolas Greenleaf", email: "legolas@mirkwood.com", category: "Gamer", status: "Ativo", avatar: "https://picsum.photos/seed/legolas/40/40" },
  { id: 'usr_saruman', name: "Saruman, o Branco", email: "saruman@isengard.com", category: "Master", status: "Bloqueado", avatar: "https://picsum.photos/seed/saruman/40/40" },
];

export const getAuthenticatedUser = (): User => {
    // Esta função agora deve ser usada com cautela.
    // O ideal é buscar os dados do usuário autenticado diretamente do Firestore
    // ou usar as informações do objeto `auth.currentUser`.
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
        const foundUser = users.find(u => u.id === firebaseUser.uid || u.email === firebaseUser.email);
        if (foundUser) return foundUser;

        // Fallback se o usuário do Firebase não estiver na nossa lista mock
        return {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Novo Aventureiro',
          email: firebaseUser.email!,
          avatar: firebaseUser.photoURL || `https://picsum.photos/seed/${firebaseUser.uid}/40/40`,
          category: 'Visitante',
          status: 'Pendente',
        };
    }
    // Fallback para o usuário admin se não houver usuário Firebase (cenário de teste inicial)
    return users.find(u => u.id === 'usr_admin')!;
}
export const getUsers = (): User[] => users;
export const getUserById = (id: string): User | undefined => users.find(u => u.id === id);


// --- ROOMS ---
const rooms: Room[] = [
  { id: 'room_ghalmaraz', name: "Sala Ghal-Maraz", capacity: 8, status: "Disponível", description: "Sala temática de fantasia medieval.", image: "https://picsum.photos/seed/ghalmaraz/200/100" },
  { id: 'room_conselho', name: "Sala do Conselho", capacity: 12, status: "Em Manutenção", description: "Sala ampla para grandes grupos e eventos.", image: "https://picsum.photos/seed/conselho/200/100" },
  { id: 'room_arena', name: "Arena Imperial", capacity: 6, status: "Disponível", description: "Sala com temática de ficção científica.", image: "https://picsum.photos/seed/arena/200/100" },
  { id: 'room_taverna', name: "Taverna do Anão", capacity: 4, status: "Disponível", description: "Sala aconchegante para jogos de cartas.", image: "https://picsum.photos/seed/taverna/200/100" },
];

export const getRooms = (): Room[] => rooms;
export const getRoomById = (id: string): Room | undefined => rooms.find(r => r.id === id);

// --- BOOKINGS ---
// Adicionando mais reservas para testar a lógica de cotas
const today = new Date();
const todayStr = today.toISOString().split('T')[0];
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];


const bookings: Booking[] = [
  { 
    id: 'booking_1', 
    roomId: 'room_ghalmaraz', 
    organizerId: 'usr_frodo', 
    date: todayStr, 
    startTime: '18:00', 
    endTime: '22:30', 
    title: 'A Sociedade do Anel',
    description: 'Continuar a jornada para destruir o Um Anel.',
    participants: [
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
    title: 'Torneio de Card Game',
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
    organizerId: 'usr_aragorn', 
    date: '2024-09-15', 
    startTime: '20:00', 
    endTime: '23:30', 
    participants: [
        getUserById('usr_aragorn')!,
        getUserById('usr_legolas')!,
    ],
    guests: 0,
    status: 'Confirmada'
  },
  { 
    id: 'booking_11_corujao', 
    roomId: 'room_arena', 
    organizerId: 'usr_gandalf', 
    date: '2024-09-27', 
    startTime: '23:00', 
    endTime: '07:00', 
    title: 'Corujão de Testes',
    participants: [getUserById('usr_gandalf')!],
    guests: 1,
    status: 'Confirmada'
  },
  { 
    id: 'booking_gandalf_1', 
    roomId: 'room_taverna', 
    organizerId: 'usr_gandalf', 
    date: todayStr, 
    startTime: '08:00', 
    endTime: '12:30', 
    title: 'Sessão de World of Warcraft RPG',
    participants: [getUserById('usr_gandalf')!],
    guests: 1,
    status: 'Confirmada'
  },
];
export const getBookings = (): Booking[] => bookings;

export const createBooking = (data: Omit<Booking, 'id' | 'status'>): Booking => {
    const newBooking: Booking = {
        ...data,
        id: `booking_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        status: 'Confirmada', // Default status for new bookings
    };
    bookings.push(newBooking);
    console.log("New booking added:", newBooking);
    console.log("All bookings:", bookings);
    return newBooking;
};

export const updateBooking = (bookingId: string, data: Partial<Omit<Booking, 'id'>>): Booking | undefined => {
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex === -1) {
        console.error("Booking not found for update:", bookingId);
        return undefined;
    }

    const updatedBooking = {
        ...bookings[bookingIndex],
        ...data,
    };

    bookings[bookingIndex] = updatedBooking;
    console.log("Booking updated:", updatedBooking);
    return updatedBooking;
}


// --- NOTICES ---
const notices: Notice[] = [
    {
        id: 'notice_1',
        title: 'Bem-vindo à Versão Alfa!',
        description: "Este é um protótipo inicial para testes. Seu feedback é essencial! Envie suas sugestões para Davidson (Project Lead & DevOps Engineer) no WhatsApp: 12 99732-4548.",
        createdAt: '2024-09-01T10:00:00Z',
        readBy: []
    },
    {
        id: 'notice_2',
        title: 'Manutenção da Sala do Conselho',
        description: "A Sala do Conselho estará em manutenção nos próximos dias 15 e 16 para a instalação de novos equipamentos de som.",
        createdAt: '2024-09-10T11:00:00Z',
        readBy: [] // Ninguém leu este ainda.
    },
    {
        id: 'notice_gandalf_1',
        title: 'Aviso de Cota',
        description: 'Olá, Gandalf! Notamos que você atingiu 80% da sua cota de reservas para este mês. Planeje seus próximos jogos com sabedoria!',
        createdAt: '2024-09-12T15:00:00Z',
        targetUserId: 'usr_gandalf', // Aviso específico para Gandalf
        readBy: []
    }
];

export const getNotices = (): Notice[] => notices;

export const markNoticeAsRead = (noticeId: string, userId: string) => {
    const notice = notices.find(n => n.id === noticeId);
    if (notice && !notice.readBy.includes(userId)) {
        notice.readBy.push(userId);
        console.log(`User ${userId} marked notice ${noticeId} as read. Current readBy:`, notice.readBy);
    }
};

// --- TRANSACTIONS ---
const transactions: Transaction[] = [
  { id: "TRX001", date: "01/09/2024", description: "Mensalidade Setembro/24", amount: "R$ 50,00", status: "Pago" },
  { id: "TRX002", date: "15/08/2024", description: "Convidado extra", amount: "R$ 15,00", status: "Pago" },
  { id: "TRX003", date: "01/08/2024", description: "Mensalidade Agosto/24", amount: "R$ 50,00", status: "Pago" },
  { id: "TRX004", date: "01/07/2024", description: "Mensalidade Julho/24", amount: "R$ 50,00", status: "Pago" },
];

export const getTransactions = (): Transaction[] => transactions;

    