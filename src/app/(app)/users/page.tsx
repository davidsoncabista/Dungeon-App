"use client"

import { useState, useMemo } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { getFirestore, collection, query, where, orderBy } from "firebase/firestore"
import { app, auth } from "@/lib/firebase"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { ArrowUpDown } from "lucide-react"

import type { User, UserCategory } from "@/lib/types/user"
import { UserTableRow } from "@/components/app/users/user-table-row"

type SortKey = 'name' | 'category';

export default function UsersPage() {
  const firestore = getFirestore(app);
  const [user] = useAuthState(auth);

  const usersRef = collection(firestore, 'users');
  const [users, loading, error] = useCollectionData<User>(usersRef, { idField: 'id' });
  
  const userQuery = user ? query(collection(firestore, 'users'), where('uid', '==', user.uid)) : null;
  const [appUser] = useCollectionData<User>(userQuery);
  const currentUserRole = appUser?.[0]?.role;

  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  
  const canEdit = currentUserRole === 'Administrador' || currentUserRole === 'Editor';
  const canDelete = currentUserRole === 'Administrador';


  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
        setSortKey(key);
        setSortOrder('asc');
    }
  }

  const filteredAndSortedUsers = useMemo(() => {
    if (!users) return [];
    
    let filtered = [...users];

    if (searchTerm) {
        const lowercasedTerm = searchTerm.toLowerCase();
        filtered = filtered.filter(u => 
            u.name.toLowerCase().includes(lowercasedTerm) || 
            u.email.toLowerCase().includes(lowercasedTerm) ||
            (u.nickname && u.nickname.toLowerCase().includes(lowercasedTerm))
        );
    }
    
    const categoryOrder: Record<UserCategory, number> = { "Master": 1, "Gamer": 2, "Player": 3, "Visitante": 4 };

    return filtered.sort((a, b) => {
        let comparison = 0;
        if (sortKey === 'name') {
            comparison = a.name.localeCompare(b.name);
        } else { // sort by category
            comparison = (categoryOrder[a.category] || 99) - (categoryOrder[b.category] || 99);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
    });

  }, [users, sortKey, sortOrder, searchTerm]);


  const renderContent = () => {
    if (loading) {
        return Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
                <TableCell>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex flex-col gap-1">
                             <Skeleton className="h-4 w-32" />
                             <Skeleton className="h-3 w-40" />
                        </div>
                    </div>
                </TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                <TableCell className="hidden sm:table-cell text-center"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                <TableCell className="hidden md:table-cell text-right"><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
            </TableRow>
        ));
    }

    if (error) {
        return <TableRow><TableCell colSpan={5} className="h-24 text-center text-destructive">Erro ao carregar usuários: {error.message}. Verifique as regras de segurança do Firestore.</TableCell></TableRow>;
    }

    if (!filteredAndSortedUsers || filteredAndSortedUsers.length === 0) {
        return <TableRow><TableCell colSpan={5} className="h-24 text-center">Nenhum usuário encontrado com os filtros atuais.</TableCell></TableRow>;
    }
    
    return filteredAndSortedUsers.map(u => (
        <UserTableRow
            key={u.uid}
            user={u}
            canEdit={canEdit}
            canDelete={canDelete}
        />
    ));
  }


  return (
    <div className="grid gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">Visualize e gerencie os membros da associação.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membros</CardTitle>
          <CardDescription>Uma lista de todos os usuários cadastrados no sistema. A criação de novos usuários é feita automaticamente quando eles logam com o Google pela primeira vez.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
             <Input 
                placeholder="Buscar por nome, e-mail ou apelido..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('name')} className="px-0">
                       Membro <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                    <Button variant="ghost" onClick={() => handleSort('category')} className="px-0">
                       Categoria <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </TableHead>
                <TableHead className="hidden md:table-cell">Nível de Acesso</TableHead>
                <TableHead className="hidden sm:table-cell text-center">Status</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderContent()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
