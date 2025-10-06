"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { X, Plus, Dices, RotateCcw, Trash2, Shield, Sword, Heart, PlusCircle, MinusCircle, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

function ActorCard({ actor, onUpdate, onRemove }: { actor: Actor; onUpdate: (updatedActor: Actor) => void; onRemove: () => void; }) {
  const styles = typeStyles[actor.type];

  const handleInputChange = (field: keyof Actor, value: string | number) => {
    onUpdate({ ...actor, [field]: value });
  };

  const handleHpChange = (amount: number) => {
    const newHp = Math.min(Math.max(0, actor.hp + amount), actor.maxHp);
    onUpdate({ ...actor, hp: newHp });
  };

  const addStatus = () => {
    const newStatus: Status = { id: `status_${Date.now()}`, name: '', duration: 0 };
    onUpdate({ ...actor, statuses: [...actor.statuses, newStatus] });
  };

  const updateStatus = (statusId: string, field: 'name' | 'duration', value: string | number) => {
    const newStatuses = actor.statuses.map(s => 
      s.id === statusId ? { ...s, [field]: value } : s
    );
    onUpdate({ ...actor, statuses: newStatuses });
  };

  const removeStatus = (statusId: string) => {
    onUpdate({ ...actor, statuses: actor.statuses.filter(s => s.id !== statusId) });
  };

  const toggleType = () => {
    const types: ActorType[] = ["Neutro", "Aliado", "Inimigo", "Ambiente"];
    const currentIndex = types.indexOf(actor.type);
    const nextType = types[(currentIndex + 1) % types.length];
    onUpdate({ ...actor, type: nextType });
  };

  return (
    <Card className={cn("text-white transition-colors duration-300", styles.bg, styles.border)}>
      <CardContent className="p-4 space-y-3">
        {/* Linha Principal */}
        <div className="flex items-center gap-2">
          <Select value={actor.tier} onValueChange={(value: Tier) => handleInputChange('tier', value)}>
            <SelectTrigger className="w-20 bg-background/20 border-white/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['D', 'C', 'B', 'A', 'S'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input 
            value={actor.name} 
            onChange={(e) => handleInputChange('name', e.target.value)} 
            placeholder="Nome do Ator"
            className="flex-1 bg-background/20 border-white/20" 
          />
          <Input 
            type="number" 
            value={actor.initiative} 
            onChange={(e) => handleInputChange('initiative', parseInt(e.target.value) || 0)} 
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
          <Button size="icon" variant="destructive" onClick={onRemove}><X size={20}/></Button>
        </div>

        {/* Linha de Vida e Notas */}
        <div className="flex items-center gap-2">
           <Heart className="h-5 w-5 text-red-400" />
           <Input 
            type="number" 
            value={actor.hp} 
            onChange={(e) => handleInputChange('hp', Math.min(Math.max(0, parseInt(e.target.value)), actor.maxHp))} 
            className="w-20 text-center bg-background/20 border-white/20"
          />
          <span className="text-lg">/</span>
          <Input 
            type="number" 
            value={actor.maxHp} 
            onChange={(e) => handleInputChange('maxHp', parseInt(e.target.value) || 0)} 
            className="w-20 text-center bg-background/20 border-white/20"
          />
          <Input 
            value={actor.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
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

// --- Componente Principal da Página ---

export default function AmazegamePage() {
  const [actors, setActors] = useState<Actor[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  
  const addHistory = (entry: string) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    setHistory(prev => [...prev, `[${timestamp}] ${entry}`]);
  };
  
  const sortedActors = useMemo(() => {
    return [...actors].sort((a, b) => {
      const initA = a.initiative + (a.type === 'Inimigo' ? 0.5 : 0);
      const initB = b.initiative + (b.type === 'Inimigo' ? 0.5 : 0);
      return initB - initA;
    });
  }, [actors]);

  const addActor = () => {
    const newActor: Actor = {
      id: `actor_${Date.now()}`,
      name: '',
      tier: 'D',
      initiative: 0,
      type: 'Neutro',
      hp: 0,
      maxHp: 0,
      notes: '',
      statuses: [],
    };
    setActors(prev => [...prev, newActor]);
  };

  const updateActor = (updatedActor: Actor) => {
    setActors(prev => prev.map(a => a.id === updatedActor.id ? updatedActor : a));
  };
  
  const removeActor = (actorId: string) => {
    setActors(prev => prev.filter(a => a.id !== actorId));
  };

  const rollAllInitiatives = () => {
    addHistory("Rolando iniciativas para todos os atores...");
    const tierDice: Record<Tier, number> = { S: 4, A: 6, B: 8, C: 10, D: 12 };

    const updatedActors = actors.map(actor => {
      const d = tierDice[actor.tier];
      let total = 0;
      let rolls = [];
      for (let i = 0; i < 3; i++) {
        const roll = Math.floor(Math.random() * d) + 1;
        total += roll;
        rolls.push(roll);
      }
      addHistory(`${actor.name || 'Ator sem nome'} (3d${d}): ${rolls.join(' + ')} = ${total}`);
      return { ...actor, initiative: total };
    });
    setActors(updatedActors);
  };
  
  const nextCycle = () => {
    addHistory("Avançando para o próximo ciclo...");
    const updatedActors = actors.map(actor => {
      const newInitiative = Math.max(0, actor.initiative - 10);
      
      const updatedStatuses = actor.statuses.map(s => ({ ...s, duration: Math.max(0, s.duration - 1) })).filter(s => {
        if (s.duration === 0) {
            addHistory(`Status '${s.name}' em ${actor.name || 'ator'} terminou.`);
            return false;
        }
        return true;
      });

      return { ...actor, initiative: newInitiative, statuses: updatedStatuses };
    });
    setActors(updatedActors);
  };

  const clearAll = () => {
    addHistory("Limpando todos os dados.");
    setActors([]);
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4 md:p-8">
      <h1 className="text-4xl font-bold text-center mb-8 font-headline">Maze Tracker</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-black/50">
            <CardHeader>
                <div className="flex items-center justify-between gap-4">
                    <CardTitle>Controle de Iniciativa</CardTitle>
                    <div className="flex items-center gap-2">
                        <Button onClick={addActor} variant="outline" className="bg-green-600 hover:bg-green-700 border-green-800"><Plus size={18}/></Button>
                        <Button onClick={rollAllInitiatives} variant="outline" className="bg-blue-600 hover:bg-blue-700 border-blue-800"><Dices size={18}/></Button>
                        <Button onClick={nextCycle} variant="outline" className="bg-yellow-600 hover:bg-yellow-700 border-yellow-800">Ciclo</Button>
                        <Button onClick={clearAll} variant="destructive"><Trash2 size={18}/></Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                 {sortedActors.map(actor => (
                    <ActorCard key={actor.id} actor={actor} onUpdate={updateActor} onRemove={() => removeActor(actor.id)}/>
                 ))}
                 {actors.length === 0 && (
                    <div className="text-center text-muted-foreground py-10">
                        <p>Nenhum ator na batalha.</p>
                        <p>Clique em "+" para começar.</p>
                    </div>
                 )}
            </CardContent>
          </Card>
        </div>
        
        {/* Coluna de Histórico */}
        <div className="lg:col-span-1">
             <Card className="bg-black/50 sticky top-8">
                <CardHeader>
                    <CardTitle>Histórico de Eventos</CardTitle>
                    <CardDescription>Registro de rolagens e ações.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="bg-gray-900/50 p-3 rounded-md h-96 overflow-y-auto text-sm font-mono">
                        {history.map((entry, index) => (
                            <p key={index} className="whitespace-pre-wrap break-words">{entry}</p>
                        ))}
                         {history.length === 0 && <p className="text-muted-foreground">O histórico está vazio.</p>}
                    </div>
                </CardContent>
             </Card>
        </div>
      </div>
    </div>
  );
}
