import { api } from "./api-client";

// Backend returns camelCase, but the API client will handle the mapping.
// These interfaces represent the data after it has been transformed to camelCase.

export interface FinanceAccount {
  startingBalance: number;
  currentBalance: number;
  balanceAsOfDate: string;
  createdAt?: string;
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
  dueDay: number;
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
}

export interface CalendarBill {
  id: number;
  name: string;
  amount: number;
  dueDay: number;
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

export interface CalendarDay {
  date: string;
  isCurrentMonth: boolean;
  bills: CalendarBill[];
  paychecks: CalendarPaycheck[];
  expenses: CalendarExpense[];
  runningBalance: number;
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

// API Functions
export async function getFinanceData() {
  const data = await api.get<FinanceData>("/finance");
  return {
    ...data,
    account: normalizeAccount(data.account),
  };
}

export async function getCalendarData(
  startDate: string,
  endDate: string,
  monthsToShow: number,
) {
  const response = await api.post<CalendarDay[]>(
    "/finance/dashboard/calendar",
    {
      startDate: startDate,
      endDate: endDate,
      monthsToShow: monthsToShow,
    },
  );

  return response.map((day) => {
    const [year, month, dayNum] = day.date.split("-").map(Number);
    const localDate = new Date(year, month - 1, dayNum);

    return {
      ...day,
      date: localDate,
      runningBalance:
        typeof day.runningBalance === "number"
          ? day.runningBalance
          : parseFloat(day.runningBalance || "0"),
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

export async function getAccount() {
  const response = await api.get<FinanceAccount>("/finance/account");
  return normalizeAccount(response);
}

export async function updateAccount(account: Partial<FinanceAccount>) {
  const response = await api.patch<FinanceAccount>("/finance/account", account);
  return normalizeAccount(response);
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
) {
  const response = await api.post<Blob>("/finance/dashboard/export-csv", {
    startDate: startDate,
    endDate: endDate,
    monthsToShow: monthsToShow,
  });

  return response;
}
