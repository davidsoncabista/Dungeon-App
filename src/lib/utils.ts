import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { parse } from "date-fns"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// O segundo parâmetro `isEndTime` é para ajustar o cálculo.
// Se for um horário de fim, queremos o início do slot que ele representa.
export const getBookingDurationAndEnd = (time: string, isEndTime: boolean = false): { duration: number; endTime: string } => {
    if (!time || typeof time !== 'string') {
        return { duration: 0, endTime: "00:00" };
    }
    const start = parse(time, "HH:mm", new Date());
    if (isNaN(start.getTime())) {
         return { duration: 0, endTime: "00:00" };
    }

    if (isEndTime) {
        if (time === "07:00") { // Corujão termina às 7h
            return { duration: 8, endTime: "23:00" };
        }
        // Para outros horários de fim, precisamos "voltar" para o início do slot.
        const prevTime = new Date(start.getTime() - (4.5 * 60 * 60 * 1000));
        return { duration: 4.5, endTime: format(prevTime, "HH:mm") };
    }
    
    let durationHours;
    if (time === "23:00") { // Corujão
        durationHours = 8;
    } else {
        durationHours = 4.5;
    }
    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
    return { duration: durationHours, endTime: format(end, "HH:mm") };
};

    