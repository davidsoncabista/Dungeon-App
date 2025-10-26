
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { useToast } from './use-toast';

export const useIdleTimeout = (timeout: number, warningTime: number) => {
  const [isIdle, setIsIdle] = useState(false);
  const timer = useRef<NodeJS.Timeout>();
  const warningTimer = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  const handleLogout = useCallback(() => {
    auth.signOut();
    toast({
      title: "Sessão Expirada",
      description: "Você foi desconectado por inatividade.",
      variant: "destructive",
    });
  }, [toast]);

  const resetTimers = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);

    setIsIdle(false);

    warningTimer.current = setTimeout(() => {
      setIsIdle(true);
    }, timeout - warningTime);

    timer.current = setTimeout(handleLogout, timeout);
  }, [timeout, warningTime, handleLogout]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'scroll', 'click'];

    const handleActivity = () => {
      resetTimers();
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    resetTimers(); // Inicia o timer na montagem

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (timer.current) clearTimeout(timer.current);
      if (warningTimer.current) clearTimeout(warningTimer.current);
    };
  }, [resetTimers]);

  return { isIdle, reset: resetTimers };
};
