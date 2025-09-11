
import type { User } from './types/user';
import type { Room } from './types/room';
import type { Booking } from './types/booking';
import type { Notice } from './types/notice';
import type { Transaction } from './types/transaction';
import { auth } from './firebase';

// --- USERS ---
const users: User[] = []; // Os usuários agora virão do Firestore

export const getAuthenticatedUser = (): User => {
    // ESTA FUNÇÃO ESTÁ DEPRECIADA E SÓ DEVE SER USADA EM CONTEXTOS SEM ACESSO A HOOKS.
    // O ideal é buscar os dados do usuário autenticado diretamente do Firestore.
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
        return {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'Novo Aventureiro',
          email: firebaseUser.email!,
          avatar: firebaseUser.photoURL || `https://picsum.photos/seed/${firebaseUser.uid}/40/40`,
          category: 'Visitante',
          status: 'Pendente',
          role: 'Membro'
        };
    }
    // Fallback para um usuário genérico se não houver usuário Firebase.
    return {
        id: 'usr_placeholder',
        uid: 'usr_placeholder',
        name: "Usuário Desconhecido",
        email: "placeholder@example.com",
        category: "Visitante",
        status: "Pendente",
        role: "Membro",
        avatar: "https://picsum.photos/seed/placeholder/100/100"
    };
}
export const getUsers = (): User[] => {
    console.warn("getUsers() do mock-service está sendo chamado. Use a busca do Firestore em vez disso.");
    return [];
};
export const getUserById = (id: string): User | undefined => {
    console.warn("getUserById() do mock-service está sendo chamado. Use a busca do Firestore em vez disso.");
    return undefined;
}


// --- ROOMS ---
const rooms: Room[] = [
  { id: 'room_ghalmaraz', uid: 'room_ghalmaraz', name: "Sala Ghal-Maraz", capacity: 8, status: "Disponível", description: "Sala temática de fantasia medieval.", image: "https://picsum.photos/seed/ghalmaraz/200/100" },
  { id: 'room_conselho', uid: 'room_conselho', name: "Sala do Conselho", capacity: 12, status: "Em Manutenção", description: "Sala ampla para grandes grupos e eventos.", image: "https://picsum.photos/seed/conselho/200/100" },
  { id: 'room_arena', uid: 'room_arena', name: "Arena Imperial", capacity: 6, status: "Disponível", description: "Sala com temática de ficção científica.", image: "https://picsum.photos/seed/arena/200/100" },
  { id: 'room_taverna', uid: 'room_taverna', name: "Taverna do Anão", capacity: 4, status: "Disponível", description: "Sala aconchegante para jogos de cartas.", image: "https://picsum.photos/seed/taverna/200/100" },
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


let bookings: Booking[] = [
  { 
    id: 'booking_1', 
    roomId: 'room_ghalmaraz', 
    organizerId: 'usr_frodo', 
    date: todayStr, 
    startTime: '18:00', 
    endTime: '22:30', 
    title: 'A Sociedade do Anel',
    description: 'Continuar a jornada para destruir o Um Anel.',
    participants: [], // Será preenchido dinamicamente
    guests: [],
    status: 'Confirmada'
  },
  { 
    id: 'booking_2', 
    roomId: 'room_arena', 
    organizerId: 'aj6dlsAG8CXFm85ccNtivvAafia2',
    date: '2024-09-28', 
    startTime: '18:00', 
    endTime: '22:00', 
    title: 'Torneio de Card Game',
    participants: [],
    guests: [],
    status: 'Confirmada'
  },
  { 
    id: 'booking_3', 
    roomId: 'room_taverna', 
    organizerId: 'usr_aragorn', 
    date: '2024-09-15', 
    startTime: '20:00', 
    endTime: '23:30', 
    participants: [],
    guests: [],
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
    participants: [],
    guests: [],
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
    participants: [],
    guests: [],
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

export const deleteBooking = (bookingId: string): boolean => {
    const initialLength = bookings.length;
    bookings = bookings.filter(b => b.id !== bookingId);
    const success = bookings.length < initialLength;
    if(success) {
        console.log("Booking deleted:", bookingId);
    } else {
        console.error("Booking not found for deletion:", bookingId);
    }
    return success;
}

// --- TRANSACTIONS ---
const transactions: Transaction[] = [
  { id: "TRX001", date: "01/09/2024", description: "Mensalidade Setembro/24", amount: "R$ 50,00", status: "Pago" },
  { id: "TRX002", date: "15/08/2024", description: "Convidado extra", amount: "R$ 15,00", status: "Pago" },
  { id: "TRX003", date: "01/08/2024", description: "Mensalidade Agosto/24", amount: "R$ 50,00", status: "Pago" },
  { id: "TRX004", date: "01/07/2024", description: "Mensalidade Julho/24", amount: "R$ 50,00", status: "Pago" },
];

export const getTransactions = (): Transaction[] => transactions;
