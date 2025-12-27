export interface Market {
  id: string;
  title: string;
  description: string;
  category: string;
  endDate: string;
  createdBy: string;
  createdAt: string;
  yesPool: number;
  noPool: number;
  totalPool: number;
  status: 'active' | 'ended';
}

export interface Bet {
  id: string;
  marketId: string;
  userId: string;
  username: string;
  position: 'yes' | 'no';
  amount: number;
  timestamp: string;
  marketTitle: string;
}
