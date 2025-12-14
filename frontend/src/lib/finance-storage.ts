import type {
  FinanceData,
  FinanceAccount,
  RecurringBill,
  Paycheck,
  Expense,
} from "./types";

const STORAGE_KEY = "financeData";

export function getFinanceData(): FinanceData | null {
  if (typeof window === "undefined") return null;

  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveFinanceData(data: FinanceData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function initializeAccount(
  startingBalance: number,
  balanceAsOfDate: string,
): FinanceData {
  const data: FinanceData = {
    account: {
      startingBalance,
      balanceAsOfDate,
      currentBalance: startingBalance,
      createdAt: new Date().toISOString(),
    },
    recurringBills: [],
    paychecks: [],
    expenses: [],
  };
  saveFinanceData(data);
  return data;
}

export function updateAccount(account: Partial<FinanceAccount>): void {
  const data = getFinanceData();
  if (!data) return;

  data.account = { ...data.account, ...account };
  saveFinanceData(data);
}

export function addRecurringBill(bill: RecurringBill): void {
  const data = getFinanceData();
  if (!data) return;

  data.recurringBills.push(bill);
  saveFinanceData(data);
}

export function updateRecurringBill(
  id: string,
  updates: Partial<RecurringBill>,
): void {
  const data = getFinanceData();
  if (!data) return;

  const index = data.recurringBills.findIndex((b) => b.id === id);
  if (index !== -1) {
    data.recurringBills[index] = { ...data.recurringBills[index], ...updates };
    saveFinanceData(data);
  }
}

export function deleteRecurringBill(id: string): void {
  const data = getFinanceData();
  if (!data) return;

  data.recurringBills = data.recurringBills.filter((b) => b.id !== id);
  saveFinanceData(data);
}

export function addPaycheck(paycheck: Paycheck): void {
  const data = getFinanceData();
  if (!data) return;

  data.paychecks.push(paycheck);
  saveFinanceData(data);
}

export function updatePaycheck(id: string, updates: Partial<Paycheck>): void {
  const data = getFinanceData();
  if (!data) return;

  const index = data.paychecks.findIndex((p) => p.id === id);
  if (index !== -1) {
    data.paychecks[index] = { ...data.paychecks[index], ...updates };
    saveFinanceData(data);
  }
}

export function deletePaycheck(id: string): void {
  const data = getFinanceData();
  if (!data) return;

  data.paychecks = data.paychecks.filter((p) => p.id !== id);
  saveFinanceData(data);
}

export function addExpense(expense: Expense): void {
  const data = getFinanceData();
  if (!data) return;

  data.expenses.push(expense);
  saveFinanceData(data);
}

export function updateExpense(id: string, updates: Partial<Expense>): void {
  const data = getFinanceData();
  if (!data) return;

  const index = data.expenses.findIndex((e) => e.id === id);
  if (index !== -1) {
    data.expenses[index] = { ...data.expenses[index], ...updates };
    saveFinanceData(data);
  }
}

export function deleteExpense(id: string): void {
  const data = getFinanceData();
  if (!data) return;

  data.expenses = data.expenses.filter((e) => e.id !== id);
  saveFinanceData(data);
}

export function propagatePaychecks(
  paycheck: Paycheck,
  startDate: string,
): void {
  const data = getFinanceData();
  if (!data) return;

  const [year, month, day] = startDate.split("-").map(Number);
  const start = new Date(year, month - 1, day);
  const endDate = new Date(start);
  endDate.setFullYear(endDate.getFullYear() + 1); // Propagate for 1 year

  // Add the initial paycheck
  data.paychecks.push({ ...paycheck, date: startDate });

  const currentDate = new Date(start);

  while (currentDate <= endDate) {
    if (paycheck.frequency === "biweekly") {
      currentDate.setDate(currentDate.getDate() + 14);
    } else if (paycheck.frequency === "bimonthly") {
      // Bi-monthly means twice a month (e.g., 1st and 15th)
      if (currentDate.getDate() < 15) {
        currentDate.setDate(15);
      } else {
        currentDate.setMonth(currentDate.getMonth() + 1);
        currentDate.setDate(1);
      }
    } else if (paycheck.frequency === "weekly") {
      currentDate.setDate(currentDate.getDate() + 7);
    } else if (paycheck.frequency === "monthly") {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else {
      break; // For custom, just add once
    }

    if (currentDate <= endDate) {
      const nextDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
      data.paychecks.push({
        ...paycheck,
        id: `${paycheck.id}-${currentDate.getTime()}`,
        date: nextDate,
      });
    }
  }

  saveFinanceData(data);
}
