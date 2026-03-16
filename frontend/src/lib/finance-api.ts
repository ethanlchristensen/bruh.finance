import { api } from "./api-client";

// Backend returns camelCase, but the API client will handle the mapping.
// These interfaces represent the data after it has been transformed to camelCase.

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
  isPayrollDeposit?: boolean;
  notes?: string | null;
}

export interface SavingsTransaction {
  id: number;
  transactionType: "deposit" | "transfer_to_checking" | string;
  amount: number;
  date: string;
  notes?: string | null;
}

export interface Category {
  id: number;
  name: string;
  type: string;
  color: string;
}

export interface RecurringBill {
  id: number;
  name: string;
  amount: number;
  frequency: "once" | "weekly" | "biweekly" | "monthly" | string;
  startDate: string;
  dueDay?: number | null;
  dayOfWeek?: number | null;
  category?: Category | null;
  category_id?: number | null;
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
  category?: Category | null;
  category_id?: number | null;
}

export interface Expense {
  id: number;
  name: string;
  amount: number;
  date: string;
  category?: Category | null;
  category_id?: number | null;
  relatedBillId?: number | null;
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

export interface CalendarBill {
  id: number;
  name: string;
  amount: number;
  frequency: string;
  dueDay?: number | null;
  category?: Category | null;
  total?: number | null;
  amountPaid?: number | null;
}

export interface CalendarPaycheck {
  id: number;
  amount: number;
  date: string;
  frequency: string;
  category?: Category | null;
}

export interface CalendarExpense {
  id: number;
  name: string;
  amount: number;
  date: string;
  category?: Category | null;
  relatedBillId?: number | null;
}

export interface CalendarSavingsTransaction {
  id: number;
  transactionType: "deposit" | "transfer_to_checking" | string;
  amount: number;
  date: string;
  notes?: string | null;
  source?: string | null;
  isRecurring?: boolean;
}

export interface CalendarDayResponse {
  date: string;
  isCurrentMonth: boolean;
  bills: CalendarBill[];
  paychecks: CalendarPaycheck[];
  expenses: CalendarExpense[];
  savingsTransactions: CalendarSavingsTransaction[];
  runningBalance: number | string;
  savingsRunningBalance: number | string;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  bills: CalendarBill[];
  paychecks: CalendarPaycheck[];
  expenses: CalendarExpense[];
  savingsTransactions: CalendarSavingsTransaction[];
  runningBalance: number;
  savingsRunningBalance: number;
}

export interface CategoryChoice {
  value: string;
  label: string;
}

export interface CategoryChoices {
  colors: CategoryChoice[];
  types: CategoryChoice[];
}

// Helper function to normalize date/datetime objects from backend
function normalizeAccount(account: FinanceAccount): FinanceAccount {
  return account;
}

function normalizeSavingsAccount(account: SavingsAccount): SavingsAccount {
  return account;
}

// API Functions
export async function getFinanceData() {
  const data = await api.get<FinanceData>("/finance");
  return {
    ...data,
    account: normalizeAccount(data.account),
    savingsAccount: normalizeSavingsAccount(data.savingsAccount),
  };
}

export async function getCalendarData(
  startDate: string,
  endDate: string,
  monthsToShow: number,
) {
  const response = await api.post<CalendarDayResponse[]>(
    "/finance/dashboard/calendar",
    {
      startDate: startDate,
      endDate: endDate,
      monthsToShow: monthsToShow,
    },
  );

  return response.map<CalendarDay>((day) => {
    const [year, month, dayNum] = day.date.split("-").map(Number);
    const localDate = new Date(year, month - 1, dayNum);

    const normalizedSavings = (day.savingsTransactions || []).map((txn) => {
      const numericAmount = Number(txn.amount);
      return {
        ...txn,
        amount: Number.isFinite(numericAmount) ? numericAmount : 0,
        isRecurring: Boolean(txn.isRecurring),
      };
    });

    const normalizedRunningBalance =
      typeof day.runningBalance === "number"
        ? day.runningBalance
        : Number.parseFloat(String(day.runningBalance || "0"));

    const normalizedSavingsBalance =
      typeof day.savingsRunningBalance === "number"
        ? day.savingsRunningBalance
        : Number.parseFloat(String(day.savingsRunningBalance || "0"));

    return {
      ...day,
      date: localDate,
      savingsTransactions: normalizedSavings,
      runningBalance: normalizedRunningBalance,
      savingsRunningBalance: normalizedSavingsBalance,
    };
  });
}

export async function initializeAccount(
  startingBalance: number,
  balanceAsOfDate: string,
) {
  const response = await api.patch<FinanceAccount>("/finance/account", {
    startingBalance,
    currentBalance: startingBalance,
    balanceAsOfDate,
  });
  return normalizeAccount(response);
}

export async function initializeSavingsAccount(
  startingBalance: number,
  balanceAsOfDate: string,
) {
  const response = await api.patch<SavingsAccount>("/finance/savings/account", {
    startingBalance,
    currentBalance: startingBalance,
    balanceAsOfDate,
  });
  return normalizeSavingsAccount(response);
}

export async function getAccount() {
  const response = await api.get<FinanceAccount>("/finance/account");
  return normalizeAccount(response);
}

export async function updateAccount(account: Partial<FinanceAccount>) {
  const response = await api.patch<FinanceAccount>("/finance/account", account);
  return normalizeAccount(response);
}

export async function getSavingsAccount() {
  const response = await api.get<SavingsAccount>("/finance/savings/account");
  return normalizeSavingsAccount(response);
}

export async function updateSavingsAccount(account: Partial<SavingsAccount>) {
  const response = await api.patch<SavingsAccount>(
    "/finance/savings/account",
    account,
  );
  return normalizeSavingsAccount(response);
}

// Recurring Bills
export async function getRecurringBills() {
  const response = await api.get<RecurringBill[]>("/finance/recurring-bills");
  return response;
}

export async function getRecurringBill(id: number) {
  const response = await api.get<RecurringBill>(
    `/finance/recurring-bills/${id}`,
  );
  return response;
}

export async function addRecurringBill(
  bill: Omit<RecurringBill, "id" | "category">,
) {
  const response = await api.post<RecurringBill>(
    "/finance/recurring-bills",
    bill,
  );
  return response;
}

export async function updateRecurringBill(
  id: number,
  bill: Partial<RecurringBill>,
) {
  const response = await api.patch<RecurringBill>(
    `/finance/recurring-bills/${id}`,
    bill,
  );
  return response;
}

export async function deleteRecurringBill(id: number) {
  await api.delete(`/finance/recurring-bills/${id}`);
}

// Paychecks
export async function getPaychecks() {
  const response = await api.get<Paycheck[]>("/finance/paychecks");
  return response;
}

export async function getPaycheck(id: number) {
  const response = await api.get<Paycheck>(`/finance/paychecks/${id}`);
  return response;
}

export async function addPaycheck(paycheck: Omit<Paycheck, "id" | "category">) {
  const response = await api.post<Paycheck>("/finance/paychecks", paycheck);
  return response;
}

export async function propagatePaychecks(paycheck: Omit<Paycheck, "id">) {
  // If the backend doesn't have a specific propagate endpoint, we'll just add the single paycheck.
  // The calendar service on the backend handles the recurrence for the dashboard view.
  return await addPaycheck(paycheck);
}

export async function updatePaycheck(id: number, paycheck: Partial<Paycheck>) {
  const response = await api.patch<Paycheck>(
    `/finance/paychecks/${id}`,
    paycheck,
  );
  return response;
}

export async function deletePaycheck(id: number) {
  await api.delete(`/finance/paychecks/${id}`);
}

// Expenses
export async function getExpenses() {
  const response = await api.get<Expense[]>("/finance/expenses");
  return response;
}

export async function getExpense(id: number) {
  const response = await api.get<Expense>(`/finance/expenses/${id}`);
  return response;
}

export async function addExpense(expense: Omit<Expense, "id" | "category">) {
  const response = await api.post<Expense>("/finance/expenses", expense);
  return response;
}

export async function updateExpense(id: number, expense: Partial<Expense>) {
  const response = await api.patch<Expense>(`/finance/expenses/${id}`, expense);
  return response;
}

export async function deleteExpense(id: number) {
  await api.delete(`/finance/expenses/${id}`);
}

// Savings Recurring Deposits
export async function getSavingsRecurringDeposits() {
  const response = await api.get<SavingsRecurringDeposit[]>(
    "/finance/savings/recurring-deposits",
  );
  return response;
}

export async function addSavingsRecurringDeposit(
  deposit: Omit<SavingsRecurringDeposit, "id">,
) {
  const response = await api.post<SavingsRecurringDeposit>(
    "/finance/savings/recurring-deposits",
    deposit,
  );
  return response;
}

export async function updateSavingsRecurringDeposit(
  id: number,
  deposit: Partial<SavingsRecurringDeposit>,
) {
  const response = await api.patch<SavingsRecurringDeposit>(
    `/finance/savings/recurring-deposits/${id}`,
    deposit,
  );
  return response;
}

export async function deleteSavingsRecurringDeposit(id: number) {
  await api.delete(`/finance/savings/recurring-deposits/${id}`);
}

// Savings Transactions
export async function getSavingsTransactions() {
  const response = await api.get<SavingsTransaction[]>(
    "/finance/savings/transactions",
  );
  return response;
}

export async function addSavingsTransaction(
  transaction: Omit<SavingsTransaction, "id">,
) {
  const response = await api.post<SavingsTransaction>(
    "/finance/savings/transactions",
    transaction,
  );
  return response;
}

export async function deleteSavingsTransaction(id: number) {
  await api.delete(`/finance/savings/transactions/${id}`);
}

// Categories
export async function getCategories() {
  const response = await api.get<Category[]>("/finance/categories");
  return response;
}

export async function getCategoryChoices() {
  const response = await api.get<CategoryChoices>(
    "/finance/categories/choices",
  );
  return response;
}

export async function addCategory(category: Omit<Category, "id">) {
  const response = await api.post<Category>("/finance/categories", category);
  return response;
}

export async function updateCategory(id: number, category: Partial<Category>) {
  const response = await api.put<Category>(
    `/finance/categories/${id}`,
    category,
  );
  return response;
}

export async function deleteCategory(id: number) {
  await api.delete(`/finance/categories/${id}`);
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

export async function exportCSV(
  startDate: string,
  endDate: string,
  monthsToShow: number,
  includeAllDays: boolean = true,
) {
  const response = await api.post<Blob>(
    "/finance/dashboard/export-csv",
    {
      startDate: startDate,
      endDate: endDate,
      monthsToShow: monthsToShow,
      includeAllDays: includeAllDays,
    },
    { responseType: "blob" },
  );

  return response;
}
