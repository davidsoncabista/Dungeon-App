
export type AccessPermission = "editor" | "revisor";

export interface AccessRule {
  id: string; // Ex: 'Moderador', 'Financeiro', etc.
  title: string; // Ex: 'Moderador de Conteúdo'
  description: string;
  // A chave é o caminho da página (ex: '/admin/rooms') e o valor é o nível de permissão.
  pages: Record<string, AccessPermission>;
}
