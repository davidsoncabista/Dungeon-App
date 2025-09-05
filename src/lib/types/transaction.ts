export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: "Pago" | "Pendente" | "Vencido";
}
