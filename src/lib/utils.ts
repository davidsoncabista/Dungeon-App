import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { parse } from "date-fns"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getBookingDurationAndEnd = (startTime: string): { duration: number; endTime: string } => {
    if (!startTime || typeof startTime !== 'string') {
        return { duration: 0, endTime: "" };
    }
    const start = parse(startTime, "HH:mm", new Date());
    if (isNaN(start.getTime())) {
         return { duration: 0, endTime: "" };
    }
    
    let durationHours;
    if (startTime === "23:00") {
        durationHours = 8;
    } else {
        durationHours = 4.5;
    }
    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
    return { duration: durationHours, endTime: format(end, "HH:mm") };
};

    