export interface FinanceAccount {
  startingBalance: number;
  currentBalance: number;
  balanceAsOfDate: string;
  createdAt: string;
}

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  dueDay: number; // day of month (1-31)
  category: string;
  color: string;
  total?: number; // optional total amount for bills with a payoff amount
  amountPaid?: number; // track how much has been paid
}

export interface Paycheck {
  id: string;
  amount: number;
  date: string; // ISO date string
  frequency: "weekly" | "biweekly" | "bimonthly" | "monthly" | "custom";
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  date: string; // ISO date string
  category: string;
}

export interface FinanceData {
  account: FinanceAccount;
  recurringBills: RecurringBill[];
  paychecks: Paycheck[];
  expenses: Expense[];
}
