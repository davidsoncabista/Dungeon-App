
"use client";

import { useState, useMemo, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Dices, RotateCcw, Trash2, Shield, Sword, Heart, PlusCircle, MinusCircle, Tag, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getFirestore, collection, doc, setDoc, deleteDoc, updateDoc, writeBatch, query, orderBy, onSnapshot, serverTimestamp, addDoc, getDocs, where } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { app } from '@/lib/firebase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FirestorePermissionError } from '@/lib/types/Errors';
import { errorEmitter } from '@/lib/error-emitter';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Tipos e Dados ---

type ActorType = "Aliado" | "Inimigo" | "Neutro" | "Ambiente";
type Tier = "S" | "A" | "B" | "C" | "D";

interface Status {
  id: string;
  name: string;
  duration: number;
}

interface Actor {
  id: string;
  name: string;
  tier: Tier;
  initiative: number;
  type: ActorType;
  hp: number;
  maxHp: number;
  notes: string;
  statuses: Status[];
}

interface LogEntry {
  id: string;
  message: string;
  timestamp: {
    seconds: number;
    nanoseconds: number;
  } | null;
}

// --- Componentes ---

function ActorCard({ actor, sessionId, addLogEntry }: { actor: Actor; sessionId: string; addLogEntry: (message: string) => Promise<void> }) {
  const firestore = getFirestore(app);
  
  // Estado local para os inputs para permitir a funcionalidade da calculadora
  const [initiativeInputValue, setInitiativeInputValue] = useState(String(actor.initiative));
  const [hpInputValue, setHpInputValue] = useState(String(actor.hp));
  const [maxHpInputValue, setMaxHpInputValue] = useState(String(actor.maxHp));
  const [statusDurations, setStatusDurations] = useState<Record<string, string>>(
      () => actor.statuses.reduce((acc, s) => ({...acc, [s.id]: String(s.duration)}), {})
  );

  useEffect(() => {
    setInitiativeInputValue(String(actor.initiative));
    setHpInputValue(String(actor.hp));
    setMaxHpInputValue(String(actor.maxHp));
    setStatusDurations(actor.statuses.reduce((acc, s) => ({...acc, [s.id]: String(s.duration)}), {}));
  }, [actor]);


  const typeStyles: Record<ActorType, { bg: string; border: string; buttonBg: string; buttonBorder: string }> = {
    Aliado: { bg: 'bg-green-900/50', border: 'border-green-500', buttonBg: 'bg-green-500', buttonBorder: 'border-green-700' },
    Inimigo: { bg: 'bg-red-900/50', border: 'border-red-500', buttonBg: 'bg-red-500', buttonBorder: 'border-red-700' },
    Neutro: { bg: 'bg-gray-800/50', border: 'border-gray-500', buttonBg: 'bg-gray-500', buttonBorder: 'border-gray-700' },
    Ambiente: { bg: 'bg-yellow-900/50', border: 'border-yellow-500', buttonBg: 'bg-yellow-500', buttonBorder: 'border-yellow-700' },
  };
  const styles = typeStyles[actor.type];

  const actorRef = doc(firestore, `amazegame/${sessionId}/actors`, actor.id);

  const handleUpdate = async (data: Partial<Actor>) => {
    updateDoc(actorRef, data).catch((err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: actorRef.path,
            operation: 'update',
            requestResourceData: data
        }));
    });
  };
  
  const handleRemove = async () => {
    deleteDoc(actorRef).catch((err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: actorRef.path,
            operation: 'delete'
        }));
    });
    await addLogEntry(`Ator "${actor.name}" foi removido.`);
  };

  const handleInitiativeChange = (value: string) => {
      let finalInitiative = actor.initiative;
      if (value.startsWith('+') || value.startsWith('-')) {
          const relativeValue = parseInt(value, 10);
          finalInitiative = !isNaN(relativeValue) ? (actor.initiative || 0) + relativeValue : actor.initiative;
      } else {
          const absoluteValue = parseInt(value, 10);
          finalInitiative = isNaN(absoluteValue) ? actor.initiative : absoluteValue;
      }
      handleUpdate({ initiative: finalInitiative });
  };

  const handleHpChange = (value: string) => {
      let finalHp = actor.hp;
      if (value.startsWith('+') || value.startsWith('-')) {
          const relativeValue = parseInt(value, 10);
          finalHp = !isNaN(relativeValue) ? (actor.hp || 0) + relativeValue : actor.hp;
      } else {
          const absoluteValue = parseInt(value, 10);
          finalHp = isNaN(absoluteValue) ? actor.hp : absoluteValue;
      }

      finalHp = Math.max(0, Math.min(finalHp, actor.maxHp));
      handleUpdate({ hp: finalHp });
  };
  
  const handleMaxHpChange = (value: string) => {
    let newMaxHp = actor.maxHp;
    if (value.startsWith('+') || value.startsWith('-')) {
        const relativeValue = parseInt(value, 10);
        newMaxHp = !isNaN(relativeValue) ? (actor.maxHp || 0) + relativeValue : actor.maxHp;
    } else {
        const absoluteValue = parseInt(value, 10);
        newMaxHp = isNaN(absoluteValue) ? actor.maxHp : absoluteValue;
    }
    
    newMaxHp = Math.max(0, newMaxHp);
    const currentHp = actor.hp;
    const updateData: Partial<Actor> = { maxHp: newMaxHp };
    
    if (currentHp > newMaxHp) {
        updateData.hp = newMaxHp;
    }
    handleUpdate(updateData);
  }

  const addStatus = async () => {
    const newStatus: Status = { id: `status_${Date.now()}`, name: 'Novo Status', duration: 10 };
    await handleUpdate({ statuses: [...actor.statuses, newStatus] });
    await addLogEntry(`Adicionado status a "${actor.name}".`);
  };

  const updateStatusName = async (statusId: string, newName: string) => {
    const newStatuses = actor.statuses.map(s => 
      s.id === statusId ? { ...s, name: newName } : s
    );
    await handleUpdate({ statuses: newStatuses });
  };

  const handleStatusDurationChange = (statusId: string, value: string) => {
    const status = actor.statuses.find(s => s.id === statusId);
    if (!status) return;

    let finalDuration = status.duration;
    if (value.startsWith('+') || value.startsWith('-')) {
      const relativeValue = parseInt(value, 10);
      finalDuration = !isNaN(relativeValue) ? (status.duration || 0) + relativeValue : status.duration;
    } else {
      const absoluteValue = parseInt(value, 10);
      finalDuration = isNaN(absoluteValue) ? status.duration : absoluteValue;
    }
    
    finalDuration = Math.max(0, finalDuration);

    const newStatuses = actor.statuses.map(s => 
      s.id === statusId ? { ...s, duration: finalDuration } : s
    );
    handleUpdate({ statuses: newStatuses });
  };


  const removeStatus = async (statusId: string) => {
    await handleUpdate({ statuses: actor.statuses.filter(s => s.id !== statusId) });
  };
  
  const toggleType = () => {
    const types: ActorType[] = ["Neutro", "Aliado", "Inimigo", "Ambiente"];
    const currentIndex = types.indexOf(actor.type);
    const nextType = types[(currentIndex + 1) % types.length];
    handleUpdate({ type: nextType });
  };

  return (
    <Card className={cn("text-white transition-colors duration-300", styles.bg, styles.border)}>
      <CardContent className="p-4 space-y-3">
        {/* Linha 1: Nome e Remover */}
        <div className="flex items-center gap-2">
           <Input 
            value={actor.name} 
            onChange={(e) => handleUpdate({ name: e.target.value })} 
            placeholder="Nome do Ator"
            className="flex-1 bg-background/20 border-white/20 font-bold text-lg" 
          />
          <Button size="icon" variant="destructive" onClick={handleRemove}><X size={20}/></Button>
        </div>
        
        {/* Container para Iniciativa, Vida e Classe */}
        <div className="flex flex-col sm:flex-row gap-2">
            {/* Iniciativa */}
            <div className="flex flex-1 items-center gap-2">
                <span className="text-sm font-semibold w-20 text-center">Iniciativa</span>
                 <Input 
                    type="text" 
                    value={initiativeInputValue}
                    onChange={(e) => setInitiativeInputValue(e.target.value)}
                    onBlur={(e) => handleInitiativeChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 text-center bg-background/20 border-white/20"
                    placeholder="Init"
                />
            </div>
            {/* Vida */}
            <div className="flex flex-1 items-center gap-2">
                <Heart className="hidden sm:block h-5 w-5 text-red-400" />
                <Input 
                  type="text" 
                  value={hpInputValue} 
                  onChange={(e) => setHpInputValue(e.target.value)}
                  onBlur={(e) => handleHpChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                  onFocus={(e) => e.target.select()}
                  className="w-full text-center bg-background/20 border-white/20"
                />
                <span className="text-lg">/</span>
                <Input 
                  type="text" 
                  value={maxHpInputValue} 
                  onChange={(e) => setMaxHpInputValue(e.target.value)}
                  onBlur={(e) => handleMaxHpChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                  onFocus={(e) => e.target.select()}
                  className="w-full text-center bg-background/20 border-white/20"
                />
            </div>
            {/* Classe e Tipo */}
             <div className="flex flex-1 items-center gap-2">
                <span className="text-sm font-semibold w-20 text-center">Classe</span>
                <Select value={actor.tier} onValueChange={(value: Tier) => handleUpdate({ tier: value })}>
                    <SelectTrigger className="flex-1 bg-background/20 border-white/20">
                    <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                    {['D', 'C', 'B', 'A', 'S'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <TooltipProvider>
                    <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="icon" variant="outline" onClick={toggleType} className={cn("w-12 h-10 transition-colors duration-300", styles.buttonBg, styles.buttonBorder, 'hover:opacity-80')}>
                        {actor.type === 'Aliado' ? <Shield size={20}/> : actor.type === 'Inimigo' ? <Sword size={20}/> : <Dices size={20}/>}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{actor.type}</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>

        {/* Linha 5: Notas */}
        <div className="flex items-center gap-2">
             <Input 
              value={actor.notes}
              onChange={(e) => handleUpdate({ notes: e.target.value })}
              placeholder="Anotações..."
              className="flex-1 bg-background/20 border-white/20"
            />
            <Button size="icon" variant="ghost" onClick={addStatus} className="hover:bg-green-500/20"><PlusCircle className="text-green-400" /></Button>
        </div>


        {/* Linha 6: Container de Status */}
        <div className="space-y-2">
            {actor.statuses.map(status => (
                <div key={status.id} className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-yellow-400" />
                    <Input 
                        value={status.name}
                        onChange={(e) => updateStatusName(status.id, e.target.value)}
                        placeholder="Status..."
                        className="flex-1 bg-background/10 border-white/10 h-8"
                    />
                    <Input 
                        type="text"
                        value={statusDurations[status.id] || ''}
                        onChange={(e) => setStatusDurations(prev => ({...prev, [status.id]: e.target.value}))}
                        onBlur={(e) => handleStatusDurationChange(status.id, e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                        onFocus={(e) => e.target.select()}
                        placeholder="Duração"
                        className="w-24 text-center bg-background/10 border-white/10 h-8"
                    />
                    <Button size="icon" variant="ghost" onClick={() => removeStatus(status.id)} className="h-8 w-8 hover:bg-red-500/20">
                        <MinusCircle className="text-red-400" />
                    </Button>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

function HistoryLog({ sessionId }: { sessionId: string }) {
    const firestore = getFirestore(app);
    const logsCollectionRef = useMemo(() => collection(firestore, `amazegame/${sessionId}/logs`), [firestore, sessionId]);
    const [logsSnapshot, loadingLogs] = useCollection(query(logsCollectionRef, orderBy('timestamp', 'desc')));
    const logs = useMemo(() => logsSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id }) as LogEntry) || [], [logsSnapshot]);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    return (
        <Card className="bg-black/50 h-full">
            <CardHeader><CardTitle>Histórico de Rolagens</CardTitle></CardHeader>
            <CardContent>
                <ScrollArea className="h-[620px] text-sm font-mono" ref={scrollAreaRef}>
                    <div className="p-4 space-y-2">
                        {loadingLogs && <p className="text-muted-foreground">Carregando histórico...</p>}
                        {logs.map((log) => (
                            <p key={log.id} className="text-gray-300">
                                <span className="text-gray-500">[{log.timestamp ? format(log.timestamp.seconds * 1000, 'HH:mm:ss', { locale: ptBR }) : '...enviando'}]</span> {log.message}
                            </p>
                        ))}
                        {!loadingLogs && logs.length === 0 && <p className="text-center text-muted-foreground pt-10">Nenhuma rolagem ainda.</p>}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}


// --- Componente de Conteúdo que usa os hooks ---
function AmazegameContent() {
    const firestore = getFirestore(app);
    const searchParams = useSearchParams();
    const router = useRouter();

    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isFirstCycleAfterRoll, setIsFirstCycleAfterRoll] = useState(false);
    const [actorCounter, setActorCounter] = useState(1);

    useEffect(() => {
        let currentSessionId = searchParams.get('session');
        if (!currentSessionId) {
            currentSessionId = `session_${Date.now()}`;
            router.replace(`/amazegame?session=${currentSessionId}`, { scroll: false });
        }
        setSessionId(currentSessionId);
    }, [searchParams, router]);

    const actorsCollectionRef = useMemo(() => sessionId ? collection(firestore, `amazegame/${sessionId}/actors`) : null, [firestore, sessionId]);
    const [actorsSnapshot, loadingActors] = useCollection(actorsCollectionRef);
    const actors = useMemo(() => actorsSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Actor[] || [], [actorsSnapshot]);

    const sortedActors = useMemo(() => {
        return [...actors].sort((a, b) => {
            const initDiff = a.initiative - b.initiative;
            if (initDiff !== 0) {
                return initDiff; // Ordena do menor para o maior
            }
            // Regra de desempate: Inimigo tem prioridade
            if (a.type === 'Inimigo' && b.type !== 'Inimigo') {
                return -1; // 'a' vem antes
            }
            if (b.type === 'Inimigo' && a.type !== 'Inimigo') {
                return 1; // 'b' vem antes
            }
            return 0; // Mantém a ordem se ambos são/não são inimigos
        });
    }, [actors]);

    const addLogEntry = async (message: string) => {
        if (!sessionId) return;
        const logsRef = collection(firestore, `amazegame/${sessionId}/logs`);
        await addDoc(logsRef, { message, timestamp: serverTimestamp() });
    };

    const addActor = async () => {
        if (!sessionId) return;
        const newActorName = `Novo Ator ${actorCounter}`;
        const newActorData: Omit<Actor, 'id'> = {
            name: newActorName,
            tier: 'D',
            initiative: 0,
            type: 'Neutro',
            hp: 10,
            maxHp: 10,
            notes: '',
            statuses: [],
        };
        const actorsRef = collection(firestore, `amazegame/${sessionId}/actors`);
        const newDoc = await addDoc(actorsRef, newActorData).catch((err) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: actorsRef.path,
                operation: 'create',
                requestResourceData: newActorData
            }));
        });
        if(newDoc) {
            await addLogEntry(`Ator "${newActorName}" foi adicionado.`);
            setActorCounter(prev => prev + 1);
        }
    };

    const rollAllInitiatives = async () => {
        if (!actors || actors.length === 0 || !sessionId) return;
        await addLogEntry("Rolando iniciativas para todos...");
        const batch = writeBatch(firestore);
        const tierDice: Record<Tier, number> = { S: 4, A: 6, B: 8, C: 10, D: 12 };
        
        const logPromises: Promise<void>[] = [];

        actors.forEach(actor => {
            const d = tierDice[actor.tier];
            const rolls = Array.from({ length: 3 }, () => Math.floor(Math.random() * d) + 1);
            const total = rolls.reduce((a, b) => a + b, 0);
            
            logPromises.push(addLogEntry(`${actor.name} rolou 3d${d} (${rolls.join(' + ')}) = ${total}`));
            
            const actorRef = doc(firestore, `amazegame/${sessionId}/actors`, actor.id);
            batch.update(actorRef, { initiative: total });
        });
        
        await Promise.all(logPromises);

        batch.commit().catch((err) => {
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `amazegame/${sessionId}/actors`,
                operation: 'update',
            }));
        });
        setIsFirstCycleAfterRoll(true);
    };

    const nextCycle = async () => {
        if (!actors || actors.length === 0 || !sessionId) return;
        await addLogEntry("Avançando para o próximo ciclo...");
        const batch = writeBatch(firestore);
        
        const statusLogPromises: Promise<void>[] = [];

        actors.forEach(actor => {
            let newInitiative;
            if (isFirstCycleAfterRoll) {
                newInitiative = Math.floor(actor.initiative / 10) * 10;
            } else {
                newInitiative = Math.max(0, actor.initiative - 10);
            }

            const updatedStatuses = actor.statuses
                .map(s => ({ ...s, duration: Math.max(0, s.duration - 10) }))
                .filter(s => {
                    if (s.duration === 0) {
                        statusLogPromises.push(addLogEntry(`Status "${s.name}" em "${actor.name}" terminou.`));
                    }
                    return s.duration > 0;
                });
            const actorRef = doc(firestore, `amazegame/${sessionId}/actors`, actor.id);
            batch.update(actorRef, { initiative: newInitiative, statuses: updatedStatuses });
        });
        
        await Promise.all(statusLogPromises);

        batch.commit().catch((err) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `amazegame/${sessionId}/actors`,
                operation: 'update',
            }));
        });
        
        if (isFirstCycleAfterRoll) {
            setIsFirstCycleAfterRoll(false);
        }
    };

    const clearAll = async () => {
        if (!actors || actors.length === 0 || !sessionId) return;
        
        await addLogEntry("Sessão de combate limpa.");
        
        const batch = writeBatch(firestore);
        actors.forEach(actor => {
            const actorRef = doc(firestore, `amazegame/${sessionId}/actors`, actor.id);
            batch.delete(actorRef);
        });
        
        const logsRef = collection(firestore, `amazegame/${sessionId}/logs`);
        const logsSnapshot = await getDocs(logsRef);
        logsSnapshot.forEach(logDoc => batch.delete(logDoc.ref));


        batch.commit().catch((err) => {
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `amazegame/${sessionId}`,
                operation: 'delete'
            }));
        });
    };

    if (!sessionId) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <Loader2 className="h-16 w-16 text-primary animate-spin"/>
            </div>
        )
    }

    return (
        <div className="bg-gray-900 min-h-screen text-white p-4 md:p-8">
            <h1 className="text-4xl font-bold text-center mb-8 font-headline">Maze Tracker</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {/* Coluna Principal */}
                <div className="space-y-4 lg:col-span-2">
                    <Card className="bg-black/50">
                        <CardHeader>
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <CardTitle>Controle de Iniciativa</CardTitle>
                                <div className="flex items-center gap-2">
                                    <Button onClick={addActor} variant="outline" className="bg-green-600 hover:bg-green-700 border-green-800"><Plus size={18}/></Button>
                                    <Button onClick={rollAllInitiatives} variant="outline" className="bg-blue-600 hover:bg-blue-700 border-blue-800"><Dices size={18}/></Button>
                                    <Button onClick={nextCycle} variant="outline" className="bg-yellow-600 hover:bg-yellow-700 border-yellow-800">Ciclo</Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                             <Button variant="destructive"><Trash2 size={18}/></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Limpar Tudo?</AlertDialogTitle>
                                                <AlertDialogDescription>Esta ação removerá todos os atores e logs da sessão atual. Não pode ser desfeito.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={clearAll}>Sim, limpar tudo</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <ScrollArea className="h-[550px] pr-3">
                                {loadingActors && (
                                    <div className="text-center text-muted-foreground py-10">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto"/>
                                    </div>
                                )}
                                {sortedActors.map(actor => (
                                    <div key={actor.id} className="mb-4">
                                      <ActorCard actor={actor} sessionId={sessionId} addLogEntry={addLogEntry}/>
                                    </div>
                                ))}
                                {actors && actors.length === 0 && !loadingActors && (
                                    <div className="text-center text-muted-foreground py-10">
                                        <p>Nenhum ator na batalha.</p>
                                        <p>Clique em "+" para começar.</p>
                                    </div>
                                )}
                             </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
                 {/* Coluna do Histórico */}
                 <div>
                    <HistoryLog sessionId={sessionId} />
                </div>
            </div>
        </div>
    );
}

// --- Componente Principal da Página ---
export default function AmazegamePage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <Loader2 className="h-16 w-16 text-primary animate-spin"/>
            </div>
        }>
            <AmazegameContent />
        </Suspense>
    )
}
