"use client"

import { useMemo, useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { getFirestore, collection, query, where } from "firebase/firestore"
import { auth, app } from "@/lib/firebase"
import { getFunctions, httpsCallable } from 'firebase/functions';

import type { Poll, Vote, PollDescriptionItem } from "@/lib/types/poll"
import type { User } from "@/lib/types/user"


import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Vote as VoteIcon, ThumbsUp, BarChart3, Loader2, Hourglass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function PollDescriptionCard({ item, user }: { item: PollDescriptionItem, user?: User }) {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-start gap-4 bg-muted/50">
                {user && (
                    <Avatar className="h-12 w-12 border">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                )}
                <div className="flex-1">
                    <CardTitle>{item.title}</CardTitle>
                    {user && <CardDescription>{user.name}</CardDescription>}
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
            </CardContent>
        </Card>
    )
}

export default function VotingPage() {
    const [user, loadingAuth] = useAuthState(auth);
    const firestore = getFirestore(app);
    const functions = getFunctions(app, 'southamerica-east1');
    const { toast } = useToast();

    // State
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Firestore Data ---
    const pollQuery = user ? query(collection(firestore, 'polls'), where('status', '==', 'Aberta'), where('eligibleVoters', 'array-contains', user.uid)) : null;
    const [activePolls, loadingPolls] = useCollectionData<Poll>(pollQuery, { idField: 'id' });
    const activePoll = useMemo(() => activePolls?.[0], [activePolls]);

    const votesQuery = activePoll ? query(collection(firestore, `polls/${activePoll.id}/votes`)) : null;
    const [votes, loadingVotes] = useCollectionData<Vote>(votesQuery, { idField: 'id' });
    
    // Query for all users to map member profiles in description
    const usersQuery = query(collection(firestore, 'users'));
    const [allUsers, loadingUsers] = useCollectionData<User>(usersQuery, { idField: 'uid' });

    const usersMap = useMemo(() => {
        if (!allUsers) return new Map<string, User>();
        return new Map(allUsers.map(u => [u.uid, u]));
    }, [allUsers]);


    // --- Memoized Values ---
    const hasVoted = useMemo(() => {
        if (!votes || !user) return false;
        return votes.some(v => v.id === user.uid);
    }, [votes, user]);

    const getOptionValue = (option: any): string => {
        return typeof option === 'string' ? option : option.value;
    };
    
    // --- Handlers ---
    const handleSubmitVote = async () => {
        if (!selectedOption || !user || !activePoll) return;
        setIsSubmitting(true);
        try {
            const castVoteFunction = httpsCallable(functions, 'castVote');
            await castVoteFunction({ pollId: activePoll.id, selectedOption });
            toast({ title: "Voto Registrado!", description: "Seu voto foi computado com sucesso. Obrigado por participar!" });
        } catch (error: any) {
            console.error("Erro ao registrar voto:", error);
            // O erro 'already-exists' é tratado pela UI reativa, então não mostramos toast para ele.
            if (error.code !== 'functions/already-exists') {
              toast({ title: "Erro!", description: error.message || "Não foi possível registrar seu voto.", variant: "destructive" });
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // --- Render Logic ---
    const isLoading = loadingAuth || loadingPolls || loadingUsers;

    if (isLoading) {
        return <Skeleton className="h-96 w-full max-w-3xl mx-auto" />;
    }

    if (!activePoll) {
        return (
            <Card className="max-w-3xl mx-auto">
                <CardContent className="pt-6 text-center">
                    <VoteIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h2 className="mt-4 text-2xl font-semibold">Nenhuma votação ativa</h2>
                    <p className="mt-2 text-muted-foreground">Não há nenhuma votação em andamento no momento. Volte mais tarde!</p>
                </CardContent>
            </Card>
        );
    }
    
    if (loadingVotes && !votes) {
        return <Skeleton className="h-96 w-full max-w-3xl mx-auto" />;
    }

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight font-headline mb-8 text-center">{activePoll.title}</h1>
            
            <div className="space-y-6 mb-8">
                {Array.isArray(activePoll.description) && activePoll.description.map((item, index) => (
                    <PollDescriptionCard key={index} item={item} user={item.memberId ? usersMap.get(item.memberId) : undefined} />
                ))}
            </div>
            
            {hasVoted ? (
                 <Card>
                    <CardHeader className="items-center text-center">
                        <Hourglass className="h-12 w-12 text-muted-foreground" />
                        <CardTitle>Voto Registrado com Sucesso!</CardTitle>
                        <CardDescription>Obrigado por participar. Os resultados serão divulgados publicamente após o encerramento da votação.</CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Escolha sua opção</CardTitle>
                        <CardDescription>Selecione uma das opções abaixo e confirme seu voto. Esta ação é irreversível.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <RadioGroup onValueChange={setSelectedOption} value={selectedOption || ""}>
                            <div className="space-y-2">
                               {activePoll.options.map((option, index) => {
                                   const optionValue = getOptionValue(option);
                                   const uniqueKey = `${optionValue}-${index}`;
                                   return (
                                        <Label key={uniqueKey} htmlFor={uniqueKey} className="flex items-center gap-4 p-4 rounded-md border has-[:checked]:bg-primary/5 has-[:checked]:border-primary transition-all cursor-pointer">
                                            <RadioGroupItem value={optionValue} id={uniqueKey} />
                                            <span className="font-semibold">{optionValue}</span>
                                        </Label>
                                   )
                               })}
                            </div>
                        </RadioGroup>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={handleSubmitVote} disabled={!selectedOption || isSubmitting} className="w-full">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Confirmar Voto
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    )
}
