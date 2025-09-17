
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { UserStatus, UserCategory } from "@/lib/types/user"
import Link from "next/link"
import { Dices, User, FileText, CalendarCheck2, PartyPopper } from "lucide-react"

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userStatus: UserStatus;
  userCategory: UserCategory;
}

export function WelcomeModal({ isOpen, onClose, userName, userStatus, userCategory }: WelcomeModalProps) {
  const [step, setStep] = useState(0);

  const initialStep = userStatus === 'Pendente' ? 0 : 1;

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);
  
  const steps = [
    // Step 0: Completar Cadastro
    {
      icon: <User className="h-10 w-10 text-primary" />,
      title: `Bem-vindo(a) à Guilda, ${userName.split(' ')[0]}!`,
      description: "Seu primeiro passo como aventureiro é registrar suas informações. Para ter acesso completo ao sistema e poder se associar, precisamos que você complete seu perfil.",
      footer: (
        <>
            <Button variant="ghost" onClick={handleNext}>Pular</Button>
            <Button asChild onClick={onClose}><Link href="/profile">Completar Cadastro</Link></Button>
        </>
      )
    },
    // Step 1: Associar-se
    {
      icon: <FileText className="h-10 w-10 text-primary" />,
      title: "Torne-se um Membro Associado",
      description: "Como membro associado, você pode reservar salas, participar de eventos exclusivos e gerenciar suas sessões. Explore nossos planos e encontre o que melhor se adapta à sua jornada!",
      footer: (
        <>
            <Button variant="ghost" onClick={handleNext}>Pular</Button>
            <Button asChild onClick={onClose}><Link href="/billing">Ver Planos de Associação</Link></Button>
        </>
      )
    },
     // Step 2: Visualizar Reservas como Convidado
    {
      icon: <CalendarCheck2 className="h-10 w-10 text-primary" />,
      title: "Já foi convidado para uma sessão?",
      description: "Mesmo sem ser um associado, se alguém o convidou para uma reserva, você pode visualizá-la na página 'Minhas Reservas'. Faça seu cadastro para não perder nenhum chamado!",
      footer: (
        <>
            <Button variant="ghost" onClick={handlePrev}>Voltar</Button>
            <Button onClick={handleNext}>Próximo</Button>
        </>
      )
    },
    // Step 3: Conclusão
    {
      icon: <PartyPopper className="h-10 w-10 text-primary" />,
      title: "Tudo Pronto!",
      description: "Agora você já conhece os caminhos. Explore a agenda, veja suas reservas e gerencie seu perfil. Que seus dados rolem sempre alto!",
      footer: (
        <>
            <Button variant="ghost" onClick={handlePrev}>Voltar</Button>
            <Button onClick={onClose}>Começar a Usar</Button>
        </>
      )
    },
  ];

  // Determina qual passo mostrar
  let currentStepIndex = step;
  // Se o usuário já completou o perfil (não é mais 'Pendente'), pulamos o passo 0
  if(userStatus !== 'Pendente' && step === 0) {
    currentStepIndex = 1;
  }
  
  const currentStep = steps[currentStepIndex];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            {currentStep.icon}
          </div>
          <DialogTitle className="text-2xl font-headline">{currentStep.title}</DialogTitle>
          <DialogDescription className="pt-2">
            {currentStep.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="justify-center pt-4 sm:justify-center">
          {currentStep.footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
