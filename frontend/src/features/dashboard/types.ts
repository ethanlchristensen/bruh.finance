import type {
  FinanceData,
  Category,
  CalendarDay,
  RecurringBill,
  SavingsRecurringDeposit,
  SavingsTransaction,
} from "@/lib/finance-api";

export type DashboardData = {
  financeData: FinanceData | null;
  categories: Category[];
  calendarDays: CalendarDay[];
  isLoading: boolean;
  error: string | null;
  currentDate: Date;
  monthsToShow: number;
  setMonthsToShow: (months: number) => void;
  setCurrentDate: (date: Date) => void;
  refreshData: () => Promise<void>;
};

export type DashboardActions = {
  handleDeleteBill: (id: number) => Promise<void>;
  handleDeletePaycheck: (id: number) => Promise<void>;
  handleDeleteExpense: (id: number) => Promise<void>;
  handleDeleteSavingsTransaction: (id: number) => Promise<void>;
  handleDeleteRecurringSavings: (id: number) => Promise<void>;
};
