
"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { X, Plus, Dices, RotateCcw, Trash2, Shield, Sword, Heart, PlusCircle, MinusCircle, Tag, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getFirestore, collection, doc, setDoc, deleteDoc, updateDoc, writeBatch, query, orderBy, onSnapshot, serverTimestamp, addDoc, getDocs, where } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { app } from '@/lib/firebase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FirestorePermissionError } from '@/lib/types/Errors';
import { errorEmitter } from '@/lib/error-emitter';

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

const typeStyles: Record<ActorType, { bg: string; border: string; buttonBg: string; buttonBorder: string }> = {
  Aliado: { bg: 'bg-green-900/50', border: 'border-green-500', buttonBg: 'bg-green-500', buttonBorder: 'border-green-700' },
  Inimigo: { bg: 'bg-red-900/50', border: 'border-red-500', buttonBg: 'bg-red-500', buttonBorder: 'border-red-700' },
  Neutro: { bg: 'bg-gray-800/50', border: 'border-gray-500', buttonBg: 'bg-gray-500', buttonBorder: 'border-gray-700' },
  Ambiente: { bg: 'bg-yellow-900/50', border: 'border-yellow-500', buttonBg: 'bg-yellow-500', buttonBorder: 'border-yellow-700' },
};

// --- Componentes ---

function ActorCard({ actor, sessionId }: { actor: Actor; sessionId: string }) {
  const firestore = getFirestore(app);
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
  };

  const addStatus = async () => {
    const newStatus: Status = { id: `status_${Date.now()}`, name: 'Novo Status', duration: 1 };
    await handleUpdate({ statuses: [...actor.statuses, newStatus] });
  };

  const updateStatus = async (statusId: string, field: 'name' | 'duration', value: string | number) => {
    const newStatuses = actor.statuses.map(s => 
      s.id === statusId ? { ...s, [field]: value } : s
    );
    await handleUpdate({ statuses: newStatuses });
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
        {/* Linha Principal */}
        <div className="flex items-center gap-2">
          <Select value={actor.tier} onValueChange={(value: Tier) => handleUpdate({ tier: value })}>
            <SelectTrigger className="w-20 bg-background/20 border-white/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['D', 'C', 'B', 'A', 'S'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input 
            value={actor.name} 
            onChange={(e) => handleUpdate({ name: e.target.value })} 
            placeholder="Nome do Ator"
            className="flex-1 bg-background/20 border-white/20" 
          />
          <Input 
            type="number" 
            value={actor.initiative} 
            onChange={(e) => handleUpdate({ initiative: parseInt(e.target.value) || 0 })} 
            className="w-20 text-center bg-background/20 border-white/20"
            placeholder="Init"
          />
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
          <Button size="icon" variant="destructive" onClick={handleRemove}><X size={20}/></Button>
        </div>

        {/* Linha de Vida e Notas */}
        <div className="flex items-center gap-2">
           <Heart className="h-5 w-5 text-red-400" />
           <Input 
            type="number" 
            value={actor.hp} 
            onChange={(e) => handleUpdate({ hp: Math.min(Math.max(0, parseInt(e.target.value)), actor.maxHp) })} 
            className="w-20 text-center bg-background/20 border-white/20"
          />
          <span className="text-lg">/</span>
          <Input 
            type="number" 
            value={actor.maxHp} 
            onChange={(e) => handleUpdate({ maxHp: parseInt(e.target.value) || 0 })} 
            className="w-20 text-center bg-background/20 border-white/20"
          />
          <Input 
            value={actor.notes}
            onChange={(e) => handleUpdate({ notes: e.target.value })}
            placeholder="Anotações..."
            className="flex-1 bg-background/20 border-white/20"
          />
          <Button size="icon" variant="ghost" onClick={addStatus} className="hover:bg-green-500/20"><PlusCircle className="text-green-400" /></Button>
        </div>

        {/* Container de Status */}
        <div className="space-y-2">
            {actor.statuses.map(status => (
                <div key={status.id} className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-yellow-400" />
                    <Input 
                        value={status.name}
                        onChange={(e) => updateStatus(status.id, 'name', e.target.value)}
                        placeholder="Status..."
                        className="flex-1 bg-background/10 border-white/10 h-8"
                    />
                     <Input 
                        type="number"
                        value={status.duration}
                        onChange={(e) => updateStatus(status.id, 'duration', parseInt(e.target.value) || 0)}
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

// --- Componente de Conteúdo que usa os hooks ---
function AmazegameContent() {
    const firestore = getFirestore(app);
    const searchParams = useSearchParams();
    const router = useRouter();

    const [sessionId, setSessionId] = useState<string | null>(null);

    // Get session ID from URL or create a new one
    useEffect(() => {
        let currentSessionId = searchParams.get('session');
        if (!currentSessionId) {
            currentSessionId = `session_${Date.now()}`;
            router.replace(`/landing/amazegame?session=${currentSessionId}`, { scroll: false });
        }
        setSessionId(currentSessionId);
    }, [searchParams, router]);

    const actorsCollectionRef = useMemo(() => sessionId ? collection(firestore, `amazegame/${sessionId}/actors`) : null, [firestore, sessionId]);
    const [actorsSnapshot, loadingActors] = useCollection(actorsCollectionRef);
    const actors = useMemo(() => actorsSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Actor[] || [], [actorsSnapshot]);

    const sortedActors = useMemo(() => {
        return [...actors].sort((a, b) => {
            const initA = a.initiative + (a.type === 'Inimigo' ? 0.5 : 0);
            const initB = b.initiative + (b.type === 'Inimigo' ? 0.5 : 0);
            return initB - initA;
        });
    }, [actors]);

    const addActor = async () => {
        if (!sessionId) return;
        const newActorData: Omit<Actor, 'id'> = {
            name: 'Novo Ator',
            tier: 'D',
            initiative: 0,
            type: 'Neutro',
            hp: 1,
            maxHp: 1,
            notes: '',
            statuses: [],
        };
        const actorsRef = collection(firestore, `amazegame/${sessionId}/actors`);
        addDoc(actorsRef, newActorData).catch((err) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: actorsRef.path,
                operation: 'create',
                requestResourceData: newActorData
            }));
        });
    };

    const rollAllInitiatives = async () => {
        if (!actors || actors.length === 0 || !sessionId) return;
        const batch = writeBatch(firestore);
        const tierDice: Record<Tier, number> = { S: 4, A: 6, B: 8, C: 10, D: 12 };
        actors.forEach(actor => {
            const d = tierDice[actor.tier];
            const total = Array.from({ length: 3 }, () => Math.floor(Math.random() * d) + 1).reduce((a, b) => a + b, 0);
            const actorRef = doc(firestore, `amazegame/${sessionId}/actors`, actor.id);
            batch.update(actorRef, { initiative: total });
        });
        batch.commit().catch((err) => {
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `amazegame/${sessionId}/actors`,
                operation: 'update',
            }));
        });
    };

    const nextCycle = async () => {
        if (!actors || actors.length === 0 || !sessionId) return;
        const batch = writeBatch(firestore);
        actors.forEach(actor => {
            const newInitiative = Math.max(0, actor.initiative - 10);
            const updatedStatuses = actor.statuses.map(s => ({ ...s, duration: Math.max(0, s.duration - 1) })).filter(s => s.duration > 0);
            const actorRef = doc(firestore, `amazegame/${sessionId}/actors`, actor.id);
            batch.update(actorRef, { initiative: newInitiative, statuses: updatedStatuses });
        });
        batch.commit().catch((err) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `amazegame/${sessionId}/actors`,
                operation: 'update',
            }));
        });
    };

    const clearAll = async () => {
        if (!actors || actors.length === 0 || !sessionId) return;
        const batch = writeBatch(firestore);
        actors.forEach(actor => {
            const actorRef = doc(firestore, `amazegame/${sessionId}/actors`, actor.id);
            batch.delete(actorRef);
        });
        batch.commit().catch((err) => {
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `amazegame/${sessionId}/actors`,
                operation: 'delete'
            }));
        });
    };

    if (!sessionId || loadingActors) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <Loader2 className="h-16 w-16 text-primary animate-spin"/>
            </div>
        )
    }

    return (
        <div className="bg-gray-900 min-h-screen text-white p-4 md:p-8">
            <h1 className="text-4xl font-bold text-center mb-8 font-headline">Maze Tracker</h1>

            <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
                {/* Coluna Principal */}
                <div className="space-y-4">
                    <Card className="bg-black/50">
                        <CardHeader>
                            <div className="flex items-center justify-between gap-4">
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
                                                <AlertDialogDescription>Esta ação removerá todos os atores da sessão atual para todos os participantes. Não pode ser desfeito.</AlertDialogDescription>
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
                            {sortedActors.map(actor => (
                                <ActorCard key={actor.id} actor={actor} sessionId={sessionId}/>
                            ))}
                            {actors && actors.length === 0 && (
                                <div className="text-center text-muted-foreground py-10">
                                    <p>Nenhum ator na batalha.</p>
                                    <p>Clique em "+" para começar.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
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
