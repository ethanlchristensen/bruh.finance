export interface FinanceAccount {
  startingBalance: number;
  currentBalance: number;
  balanceAsOfDate: string;
  createdAt?: string;
}

export interface SavingsAccount {
  startingBalance: number;
  currentBalance: number;
  balanceAsOfDate: string;
  createdAt?: string;
}

export interface SavingsRecurringDeposit {
  id: number;
  name: string;
  amount: number;
  frequency: "weekly" | "biweekly" | "monthly" | string;
  startDate: string;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  notes?: string | null;
}

export interface SavingsTransaction {
  id: number;
  transactionType: "deposit" | "transfer_to_checking" | string;
  amount: number;
  date: string;
  notes?: string | null;
}

export interface RecurringBill {
  id: number;
  name: string;
  amount: number;
  frequency: "once" | "weekly" | "biweekly" | "monthly" | string;
  startDate: string; // ISO date string
  dueDay?: number | null; // day of month (1-31) for monthly bills
  dayOfWeek?: number | null; // 0-6 for weekly/biweekly bills (0=Monday, 6=Sunday)
  category?: string;
  total?: number; // optional total amount for bills with a payoff amount
  amountPaid?: number; // track how much has been paid
}

export interface Paycheck {
  id: number;
  amount: number;
  date: string; // ISO date string
  frequency: "weekly" | "biweekly" | "bimonthly" | "monthly" | "custom";
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
}

export interface Expense {
  id: number;
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
  savingsAccount: SavingsAccount;
  savingsRecurringDeposits: SavingsRecurringDeposit[];
  savingsTransactions: SavingsTransaction[];
}
