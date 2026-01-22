export type Participant = {
  id: string;
  name: string;
};

export type Expense = {
  id: string;
  title: string;
  amount: number;
  currency: string;
  payerId: string;
  createdAt: number;
};

export type RatesMap = Record<string, number>;

export type SettlementTransfer = {
  fromId: string;
  toId: string;
  amount: number;
};

export type CurrencyRate = {
  code: string;
  name: string;
  country?: string;
  rank: number;
  unit: number;
  rateToJPY: number;
};
