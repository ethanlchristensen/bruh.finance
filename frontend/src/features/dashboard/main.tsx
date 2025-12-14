"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Trash2,
  Upload,
  TrendingUp,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  getFinanceData,
  initializeAccount,
  addRecurringBill,
  addExpense,
  propagatePaychecks,
  deleteRecurringBill,
  deletePaycheck,
  deleteExpense,
} from "@/lib/finance-storage";
import type { RecurringBill, Paycheck, Expense } from "@/lib/types";

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  bills: RecurringBill[];
  paychecks: Paycheck[];
  expenses: Expense[];
  runningBalance: number;
}

export default function DashboardPage() {
  const [financeData, setFinanceData] =
    useState<ReturnType<typeof getFinanceData>>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);

  // Dialog states
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [paycheckDialogOpen, setPaycheckDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);

  // Form states
  const [billForm, setBillForm] = useState({
    name: "",
    amount: "",
    dueDay: "",
    category: "Utilities",
    total: "",
  });
  const [paycheckForm, setPaycheckForm] = useState({
    amount: "",
    date: "",
    frequency: "biweekly" as const,
  });
  const [expenseForm, setExpenseForm] = useState({
    name: "",
    amount: "",
    date: "",
    category: "Groceries",
  });

  useEffect(() => {
    const data = getFinanceData();
    if (!data) {
      const accountData = localStorage.getItem("financeAccount");
      if (accountData) {
        const account = JSON.parse(accountData);
        initializeAccount(
          account.startingBalance,
          account.balanceAsOfDate || new Date().toISOString().split("T")[0],
        );
        setFinanceData(getFinanceData());
      } else {
        window.location.href = "/settings";
      }
    } else {
      setFinanceData(data);
    }
  }, []);

  useEffect(() => {
    if (financeData) {
      generateCalendar();
    }
  }, [financeData, currentDate]);

  const generateCalendar = () => {
    if (!financeData) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // Parse the balance as of date
    const [balanceYear, balanceMonth, balanceDay] =
      financeData.account.balanceAsOfDate.split("-").map(Number);
    const balanceAsOfDate = new Date(balanceYear, balanceMonth - 1, balanceDay);

    const days: CalendarDay[] = [];
    let runningBalance = financeData.account.startingBalance;

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      // Only calculate for dates on or after the balance date
      const shouldCalculate = date >= balanceAsOfDate;

      const dayBills = shouldCalculate
        ? financeData.recurringBills.filter((bill) => {
            const isCorrectDay = bill.dueDay === date.getDate();
            const isPaidOff =
              bill.total && bill.amountPaid && bill.amountPaid >= bill.total;
            return isCorrectDay && !isPaidOff;
          })
        : [];

      const dayPaychecks = shouldCalculate
        ? financeData.paychecks.filter((pc) => {
            const [year, month, day] = pc.date.split("-").map(Number);
            const pcDate = new Date(year, month - 1, day);
            return pcDate.toDateString() === date.toDateString();
          })
        : [];

      const dayExpenses = shouldCalculate
        ? financeData.expenses.filter((exp) => {
            const [year, month, day] = exp.date.split("-").map(Number);
            const expDate = new Date(year, month - 1, day);
            return expDate.toDateString() === date.toDateString();
          })
        : [];

      // Calculate balance changes only for dates on or after balance date
      if (shouldCalculate) {
        dayPaychecks.forEach((pc) => (runningBalance += pc.amount));
        dayBills.forEach((bill) => {
          runningBalance -= bill.amount;
          if (bill.total) {
            const updatedPaid = (bill.amountPaid || 0) + bill.amount;
            bill.amountPaid = updatedPaid;
          }
        });
        dayExpenses.forEach((exp) => (runningBalance -= exp.amount));
      }

      days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        bills: dayBills,
        paychecks: dayPaychecks,
        expenses: dayExpenses,
        runningBalance: shouldCalculate ? runningBalance : 0,
      });
    }

    setCalendarDays(days);
  };

  const handleAddBill = () => {
    const bill: RecurringBill = {
      id: Date.now().toString(),
      name: billForm.name,
      amount: Number.parseFloat(billForm.amount),
      dueDay: Number.parseInt(billForm.dueDay),
      category: billForm.category,
      color: getColorForCategory(billForm.category),
      ...(billForm.total && {
        total: Number.parseFloat(billForm.total),
        amountPaid: 0,
      }),
    };
    addRecurringBill(bill);
    setFinanceData(getFinanceData());
    setBillForm({
      name: "",
      amount: "",
      dueDay: "",
      category: "Utilities",
      total: "",
    });
    setBillDialogOpen(false);
  };

  const handleAddPaycheck = () => {
    const paycheck: Paycheck = {
      id: Date.now().toString(),
      amount: Number.parseFloat(paycheckForm.amount),
      date: paycheckForm.date,
      frequency: paycheckForm.frequency,
    };

    propagatePaychecks(paycheck, paycheckForm.date);

    setFinanceData(getFinanceData());
    setPaycheckForm({ amount: "", date: "", frequency: "biweekly" });
    setPaycheckDialogOpen(false);
  };

  const handleAddExpense = () => {
    const expense: Expense = {
      id: Date.now().toString(),
      name: expenseForm.name,
      amount: Number.parseFloat(expenseForm.amount),
      date: expenseForm.date,
      category: expenseForm.category,
    };
    addExpense(expense);
    setFinanceData(getFinanceData());
    setExpenseForm({ name: "", amount: "", date: "", category: "Groceries" });
    setExpenseDialogOpen(false);
  };

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());

      const dataLines = lines.slice(1);

      dataLines.forEach((line) => {
        const [description, dueDate, monthlyCost, remaining] = line
          .split(",")
          .map((s) => s.trim());

        if (!description || !dueDate || !monthlyCost) return;

        let dueDay: number;
        if (dueDate.includes("/")) {
          const parts = dueDate.split("/");
          dueDay = Number.parseInt(parts[1] || parts[0]);
        } else {
          dueDay = Number.parseInt(dueDate);
        }

        if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) return;

        const amount = Number.parseFloat(monthlyCost);
        if (isNaN(amount)) return;

        const bill: RecurringBill = {
          id: `${Date.now()}-${Math.random()}`,
          name: description,
          amount,
          dueDay,
          category: "Other",
          color: getColorForCategory("Other"),
        };

        if (remaining && remaining !== "") {
          const totalRemaining = Number.parseFloat(remaining);
          if (!isNaN(totalRemaining) && totalRemaining > 0) {
            bill.total = totalRemaining;
            bill.amountPaid = 0;
          }
        }

        addRecurringBill(bill);
      });

      setFinanceData(getFinanceData());
      event.target.value = "";
    };

    reader.readAsText(file);
  };

  const getColorForCategory = (category: string) => {
    const colors: Record<string, string> = {
      Utilities: "bg-blue-500",
      Rent: "bg-purple-500",
      Insurance: "bg-green-500",
      Subscription: "bg-orange-500",
      Other: "bg-gray-500",
    };
    return colors[category] || "bg-gray-500";
  };

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
    );
  };

  const handleDeleteBill = (id: string) => {
    deleteRecurringBill(id);
    setFinanceData(getFinanceData());
  };

  const handleDeletePaycheck = (id: string) => {
    deletePaycheck(id);
    setFinanceData(getFinanceData());
  };

  const handleDeleteExpense = (id: string) => {
    deleteExpense(id);
    setFinanceData(getFinanceData());
  };

  if (!financeData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6 flex flex-col gap-2">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Finance Calendar
            </h1>
            <p className="text-muted-foreground">
              Track your income, bills, and expenses
            </p>
          </div>
        </div>

        <div className="container mx-auto flex items-center p-2 bg-card rounded-lg border">
          <div className="flex items-center justify-start gap-2 w-full">
            <Link to="/priority">
              <Button size="sm" variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                Payment Priorities
              </Button>
            </Link>

            <Dialog open={billDialogOpen} onOpenChange={setBillDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Bill
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Recurring Bill</DialogTitle>
                  <DialogDescription>
                    Add a bill that repeats every month
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="billName">Bill Name</Label>
                    <Input
                      id="billName"
                      placeholder="Electric Bill"
                      value={billForm.name}
                      onChange={(e) =>
                        setBillForm({ ...billForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="billAmount">Amount</Label>
                    <Input
                      id="billAmount"
                      type="number"
                      step="0.01"
                      placeholder="150.00"
                      value={billForm.amount}
                      onChange={(e) =>
                        setBillForm({ ...billForm, amount: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDay">Due Day (1-31)</Label>
                    <Input
                      id="dueDay"
                      type="number"
                      min="1"
                      max="31"
                      placeholder="15"
                      value={billForm.dueDay}
                      onChange={(e) =>
                        setBillForm({ ...billForm, dueDay: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="billTotal">Total Amount (Optional)</Label>
                    <Input
                      id="billTotal"
                      type="number"
                      step="0.01"
                      placeholder="5000.00"
                      value={billForm.total}
                      onChange={(e) =>
                        setBillForm({ ...billForm, total: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      For bills with a payoff amount (like loans). Leave blank
                      for ongoing bills.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="billCategory">Category</Label>
                    <Select
                      value={billForm.category}
                      onValueChange={(v) =>
                        setBillForm({ ...billForm, category: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Utilities">Utilities</SelectItem>
                        <SelectItem value="Rent">Rent</SelectItem>
                        <SelectItem value="Insurance">Insurance</SelectItem>
                        <SelectItem value="Subscription">
                          Subscription
                        </SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddBill} className="w-full">
                    Add Bill
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog
              open={paycheckDialogOpen}
              onOpenChange={setPaycheckDialogOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Paycheck
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Paycheck</DialogTitle>
                  <DialogDescription>
                    Add a paycheck and automatically propagate for a year
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="paycheckAmount">Amount</Label>
                    <Input
                      id="paycheckAmount"
                      type="number"
                      step="0.01"
                      placeholder="2000.00"
                      value={paycheckForm.amount}
                      onChange={(e) =>
                        setPaycheckForm({
                          ...paycheckForm,
                          amount: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="paycheckDate">Start Date</Label>
                    <Input
                      id="paycheckDate"
                      type="date"
                      value={paycheckForm.date}
                      onChange={(e) =>
                        setPaycheckForm({
                          ...paycheckForm,
                          date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="paycheckFrequency">Frequency</Label>
                    <Select
                      value={paycheckForm.frequency}
                      onValueChange={(v: any) =>
                        setPaycheckForm({ ...paycheckForm, frequency: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">
                          Bi-Weekly (Every 2 weeks)
                        </SelectItem>
                        <SelectItem value="bimonthly">
                          Bi-Monthly (Twice a month)
                        </SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="custom">One-Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddPaycheck} className="w-full">
                    Add Paycheck
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog
              open={expenseDialogOpen}
              onOpenChange={setExpenseDialogOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Expense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add One-Time Expense</DialogTitle>
                  <DialogDescription>
                    Add expenses like groceries, gas, eating out, etc.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="expenseName">Expense Name</Label>
                    <Input
                      id="expenseName"
                      placeholder="Groceries"
                      value={expenseForm.name}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="expenseAmount">Amount</Label>
                    <Input
                      id="expenseAmount"
                      type="number"
                      step="0.01"
                      placeholder="75.50"
                      value={expenseForm.amount}
                      onChange={(e) =>
                        setExpenseForm({
                          ...expenseForm,
                          amount: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="expenseDate">Date</Label>
                    <Input
                      id="expenseDate"
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="expenseCategory">Category</Label>
                    <Select
                      value={expenseForm.category}
                      onValueChange={(v) =>
                        setExpenseForm({ ...expenseForm, category: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Groceries">Groceries</SelectItem>
                        <SelectItem value="Gas">Gas</SelectItem>
                        <SelectItem value="Eating Out">Eating Out</SelectItem>
                        <SelectItem value="Shopping">Shopping</SelectItem>
                        <SelectItem value="Entertainment">
                          Entertainment
                        </SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddExpense} className="w-full">
                    Add Expense
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <label htmlFor="csv-upload">
              <Button size="sm" variant="outline" asChild>
                <span className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </span>
              </Button>
            </label>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCSVImport}
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Current Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${financeData.account.currentBalance.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Starting Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${financeData.account.startingBalance.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                End Month Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${(() => {
                  const lastDayOfMonth = calendarDays.find(
                    (day) =>
                      day.isCurrentMonth &&
                      day.date.getMonth() === currentDate.getMonth() &&
                      day.date.getDate() ===
                        new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth() + 1,
                          0,
                        ).getDate(),
                  );
                  return (lastDayOfMonth?.runningBalance ?? 0) >= 0
                    ? "text-primary"
                    : "text-destructive";
                })()}`}
              >
                $
                {(() => {
                  const lastDayOfMonth = calendarDays.find(
                    (day) =>
                      day.isCurrentMonth &&
                      day.date.getMonth() === currentDate.getMonth() &&
                      day.date.getDate() ===
                        new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth() + 1,
                          0,
                        ).getDate(),
                  );
                  return lastDayOfMonth?.runningBalance.toFixed(2) || "0.00";
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {currentDate.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={previousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center font-semibold text-sm text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}

              {calendarDays.map((day, idx) => {
                const [balanceYear, balanceMonth, balanceDay] =
                  financeData.account.balanceAsOfDate.split("-").map(Number);
                const balanceAsOfDate = new Date(
                  balanceYear,
                  balanceMonth - 1,
                  balanceDay,
                );
                const isBeforeBalanceDate = day.date < balanceAsOfDate;

                return (
                  <div
                    key={idx}
                    className={`min-h-24 p-2 border rounded-lg ${
                      day.isCurrentMonth ? "bg-card" : "bg-muted opacity-50"
                    } ${
                      day.date.toDateString() === new Date().toDateString()
                        ? "ring-2 ring-primary"
                        : ""
                    } ${isBeforeBalanceDate ? "opacity-40" : ""}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span
                        className={`text-sm font-semibold ${
                          day.isCurrentMonth
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {day.date.getDate()}
                      </span>
                      {day.isCurrentMonth &&
                        !isBeforeBalanceDate &&
                        (day.bills.length > 0 ||
                          day.paychecks.length > 0 ||
                          day.expenses.length > 0) && (
                          <span
                            className={`text-xs font-bold ${
                              day.runningBalance >= 0
                                ? "text-primary"
                                : "text-destructive"
                            }`}
                          >
                            ${day.runningBalance.toFixed(0)}
                          </span>
                        )}
                    </div>

                    <div className="space-y-1">
                      {day.paychecks.map((pc) => (
                        <div
                          key={pc.id}
                          className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded flex items-center justify-between group"
                        >
                          <span className="font-medium truncate">
                            +${pc.amount.toFixed(0)}
                          </span>
                          <button
                            onClick={() => handleDeletePaycheck(pc.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}

                      {day.bills.map((bill) => (
                        <div
                          key={bill.id}
                          className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium truncate">
                                {bill.name}
                              </div>
                              <div className="text-[10px]">
                                -${bill.amount.toFixed(0)}
                              </div>
                              {bill.total && (
                                <div className="text-[10px] font-semibold">
                                  ${bill.amountPaid?.toFixed(0) || 0} / $
                                  {bill.total.toFixed(0)}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteBill(bill.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {day.expenses.map((exp) => (
                        <div
                          key={exp.id}
                          className="text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium truncate">
                                {exp.name}
                              </div>
                              <div className="text-[10px]">
                                -${exp.amount.toFixed(0)}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
