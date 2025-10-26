
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Hourglass } from "lucide-react";

interface IdleTimeoutModalProps {
  isOpen: boolean;
  onStay: () => void;
  countdown: number;
}

export function IdleTimeoutModal({ isOpen, onStay, countdown: initialCountdown }: IdleTimeoutModalProps) {
  const [countdown, setCountdown] = useState(initialCountdown);

  useEffect(() => {
    if (isOpen) {
      setCountdown(initialCountdown); // Reseta o contador sempre que o modal abre
      const interval = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen, initialCountdown]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onStay()}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <Hourglass className="h-10 w-10 text-primary animate-pulse" />
          </div>
          <DialogTitle className="text-2xl font-headline">Você ainda está aí?</DialogTitle>
          <DialogDescription className="pt-2">
            Sua sessão será encerrada automaticamente por inatividade em{" "}
            <span className="font-bold">{countdown}</span> segundos.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="justify-center pt-4 sm:justify-center">
          <Button onClick={onStay}>Continuar Sessão</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
