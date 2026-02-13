import { api } from "./api-client";

// Backend returns camelCase
export interface FinanceAccount {
  startingBalance: number;
  currentBalance: number;
  balanceAsOfDate: string;
  createdAt?: string;
}

export interface RecurringBill {
  id: number;
  name: string;
  amount: number;
  dueDay: number;
  category: string;
  color: string;
  total?: number | null;
  amountPaid?: number | null;
}

export interface Paycheck {
  id: number;
  amount: number;
  date: string;
  frequency: string;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  secondDayOfMonth?: number | null;
}

export interface Expense {
  id: number;
  name: string;
  amount: number;
  date: string;
  category: string;
  relatedBillId?: number | null;
}

export interface FinanceData {
  account: FinanceAccount;
  recurringBills: RecurringBill[];
  paychecks: Paycheck[];
  expenses: Expense[];
}

export interface CalendarDay {
  date: string;
  isCurrentMonth: boolean;
  bills: RecurringBill[];
  paychecks: Paycheck[];
  expenses: Expense[];
  runningBalance: number;
}

// Helper function to normalize date/datetime objects from backend
function normalizeAccount(account: FinanceAccount): FinanceAccount {
  return account;
}

// API Functions
export async function getFinanceData() {
  const data = await api.get<FinanceData>("/finance");
  return {
    ...data,
    account: normalizeAccount(data.account),
  };
}

export async function getCalendarData(startDate: string, endDate: string, monthsToShow: number) {
  const response = await api.post<CalendarDay[]>("/finance/dashboard/calendar", {
    startDate: startDate,
    endDate: endDate,
    monthsToShow: monthsToShow,
  });
  
  return response.map(day => {
    const [year, month, dayNum] = day.date.split('-').map(Number);
    const localDate = new Date(year, month - 1, dayNum);
    
    return {
      ...day,
      date: localDate,
      runningBalance: typeof day.runningBalance === 'number' ? day.runningBalance : parseFloat(day.runningBalance || '0'),
    };
  });
}

export async function initializeAccount(startingBalance: number, balanceAsOfDate: string) {
  // Get existing account first if it exists to preserve required fields
  try {
    const existingAccount = await api.get<FinanceAccount>("/finance/account");
    // Update with all required fields
    const response = await api.patch<FinanceAccount>("/finance/account", {
      starting_balance: startingBalance,
      current_balance: startingBalance,
      balance_as_of_date: balanceAsOfDate,
      created_at: existingAccount.createdAt,
    });
    return normalizeAccount(response);
  } catch (error) {
    console.error("Error:", error);
    const response = await api.patch<FinanceAccount>("/finance/account", {
      starting_balance: startingBalance,
      current_balance: startingBalance,
      balance_as_of_date: balanceAsOfDate,
    });
    return normalizeAccount(response);
  }
}

export async function getAccount() {
  const response = await api.get<FinanceAccount>("/finance/account");
  return normalizeAccount(response);
}

export async function updateAccount(account: Partial<FinanceAccount>) {
  // Get existing account first to ensure we have all required fields
  const existingAccount = await api.get<FinanceAccount>("/finance/account");
  
  // Merge the updates with existing data to satisfy backend validation
  // Backend expects snake_case for the payload, but we're using camelCase in this function signature
  const updatePayload: any = {
    starting_balance: account.startingBalance ?? existingAccount.startingBalance,
    current_balance: account.currentBalance ?? existingAccount.currentBalance,
    balance_as_of_date: account.balanceAsOfDate ?? existingAccount.balanceAsOfDate,
  };
  
  // Include created_at if it exists
  if (existingAccount.createdAt) {
    updatePayload.created_at = existingAccount.createdAt;
  }
  
  // Need to use the API directly to control the payload format
  const response = await api.patch<FinanceAccount>(
    "/finance/account",
    updatePayload
  );
  return normalizeAccount(response);
}

// Recurring Bills
export async function addRecurringBill(bill: Omit<RecurringBill, "id">) {
  const response = await api.post<RecurringBill>(
    "/finance/recurring-bills",
    bill
  );
  return response;
}

export async function updateRecurringBill(id: number, bill: Partial<RecurringBill>) {
  const response = await api.patch<RecurringBill>(
    `/finance/recurring-bills/${id}`,
    bill
  );
  return response;
}

export async function deleteRecurringBill(id: number) {
  await api.delete(`/finance/recurring-bills/${id}`);
}

// Paychecks
export async function addPaycheck(paycheck: Omit<Paycheck, "id">) {
  const response = await api.post<Paycheck>(
    "/finance/paychecks",
    paycheck
  );
  return response;
}

export async function propagatePaychecks(paycheck: Omit<Paycheck, "id">) {
  return await addPaycheck(paycheck);
}

export async function deletePaycheck(id: number) {
  await api.delete(`/finance/paychecks/${id}`);
}

// Expenses
export async function addExpense(expense: Omit<Expense, "id">) {
  const response = await api.post<Expense>(
    "/finance/expenses",
    expense
  );
  return response;
}

export async function updateExpense(id: number, expense: Partial<Expense>) {
  const response = await api.patch<Expense>(
    `/finance/expenses/${id}`,
    expense
  );
  return response;
}

export async function deleteExpense(id: number) {
  await api.delete(`/finance/expenses/${id}`);
}

// CSV Import/Export
export async function importCSV(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await api.post<{
    message: string;
    imported_count: number;
    bills: string[];
  }>("/finance/dashboard/import-csv", formData);
  
  return response;
}

export async function exportCSV(startDate: string, endDate: string, monthsToShow: number) {
  const response = await api.post<Blob>("/finance/dashboard/export-csv", {
    start_date: startDate,
    end_date: endDate,
    months_to_show: monthsToShow,
  });
  
  return response;
}
