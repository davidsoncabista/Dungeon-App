export interface Plan {
    id: string;
    name: string;
    price: number;
    weeklyQuota: number;
    monthlyQuota: number;
    corujaoQuota: number;
    invites: number;
    votingWeight: number;
    extraInvitePrice: number;
}
