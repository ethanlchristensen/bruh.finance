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
  Download,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  getFinanceData,
  addRecurringBill,
  addExpense,
  propagatePaychecks,
  deleteRecurringBill,
  deletePaycheck,
  deleteExpense,
  getCalendarData,
  importCSV,
  type CalendarDay as ApiCalendarDay,
} from "@/lib/finance-api";

interface CalendarDay extends Omit<ApiCalendarDay, "date"> {
  date: Date;
}

export default function DashboardPage() {
  const [financeData, setFinanceData] = useState<Awaited<
    ReturnType<typeof getFinanceData>
  > | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allCalendarDays, setAllCalendarDays] = useState<CalendarDay[]>([]); // All calculated days
  const [monthsToShow, setMonthsToShow] = useState(3);

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
    async function loadFinanceData() {
      try {
        console.log("Starting to load finance data...");
        const data = await getFinanceData();
        console.log("Finance data loaded successfully:", data);
        setFinanceData(data);
      } catch (error: any) {
        console.error("Failed to load finance data:", error);
        console.error("Error message:", error?.message);
        console.error("Error type:", typeof error);
        console.error("Full error object:", JSON.stringify(error, null, 2));

        // Only redirect to settings if account doesn't exist (404)
        // For other errors, show them in console but don't redirect
        if (
          error?.message?.includes("404") ||
          error?.message?.includes("Not Found")
        ) {
          console.log("No finance account found, redirecting to settings");
          window.location.href = "/settings";
        } else {
          // For other errors, just log and stay on page
          console.error("Error loading finance data (not redirecting):", error);
          alert(
            `Error loading finance data: ${error?.message || "Unknown error"}. Check console for details.`,
          );
        }
      }
    }
    loadFinanceData();
  }, []);

  // Load calendar data from API
  useEffect(() => {
    if (!financeData) return;

    const loadCalendarData = async () => {
      try {
        const balanceAsOfDateStr = financeData.account.balanceAsOfDate;
        const [y, m, d] = balanceAsOfDateStr.split("-").map(Number);

        const balanceAsOfDate = new Date(y, m - 1, d);

        const startDate = new Date(
          balanceAsOfDate.getFullYear(),
          balanceAsOfDate.getMonth(),
          1,
        );

        const endDate = new Date(balanceAsOfDate);
        endDate.setFullYear(endDate.getFullYear() + 2);

        const startDateStr = startDate.toISOString().split("T")[0];
        const endDateStr = endDate.toISOString().split("T")[0];

        const calendarData = await getCalendarData(
          startDateStr,
          endDateStr,
          24,
        );
        setAllCalendarDays(calendarData);
      } catch (error) {
        console.error("Failed to load calendar data:", error);
      }
    };

    loadCalendarData();
  }, [financeData, currentDate, monthsToShow]);

  const handleAddBill = async () => {
    try {
      const bill = {
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
      await addRecurringBill(bill);
      const data = await getFinanceData();
      setFinanceData(data);
      setBillForm({
        name: "",
        amount: "",
        dueDay: "",
        category: "Utilities",
        total: "",
      });
      setBillDialogOpen(false);
    } catch (error) {
      console.error("Failed to add bill:", error);
    }
  };

  const handleAddPaycheck = async () => {
    try {
      const paycheck = {
        amount: Number.parseFloat(paycheckForm.amount),
        date: paycheckForm.date,
        frequency: paycheckForm.frequency,
      };

      await propagatePaychecks(paycheck);

      const data = await getFinanceData();
      setFinanceData(data);
      setPaycheckForm({ amount: "", date: "", frequency: "biweekly" });
      setPaycheckDialogOpen(false);
    } catch (error) {
      console.error("Failed to add paycheck:", error);
    }
  };

  const handleAddExpense = async () => {
    try {
      const expense = {
        name: expenseForm.name,
        amount: Number.parseFloat(expenseForm.amount),
        date: expenseForm.date,
        category: expenseForm.category,
      };
      await addExpense(expense);
      const data = await getFinanceData();
      setFinanceData(data);
      setExpenseForm({ name: "", amount: "", date: "", category: "Groceries" });
      setExpenseDialogOpen(false);
    } catch (error) {
      console.error("Failed to add expense:", error);
    }
  };

  const handleCSVImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importCSV(file);
      const data = await getFinanceData();
      setFinanceData(data);
      event.target.value = "";
    } catch (error) {
      console.error("Failed to import CSV:", error);
      alert(
        "Failed to import CSV. Please check the file format and try again.",
      );
      event.target.value = "";
    }
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

  // Get the days to display based on current view
  const getDisplayDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    return allCalendarDays.filter((day) => {
      const dayYear = day.date.getFullYear();
      const dayMonth = day.date.getMonth();

      // Check if day is within the selected month range
      for (let i = 0; i < monthsToShow; i++) {
        const targetDate = new Date(year, month + i, 1);
        if (
          dayYear === targetDate.getFullYear() &&
          dayMonth === targetDate.getMonth()
        ) {
          return true;
        }
      }
      return false;
    });
  };

  const calendarDays = getDisplayDays();

  const handleDeleteBill = async (id: number) => {
    try {
      await deleteRecurringBill(id);
      const data = await getFinanceData();
      setFinanceData(data);
    } catch (error) {
      console.error("Failed to delete bill:", error);
    }
  };

  const handleDeletePaycheck = async (id: number) => {
    try {
      await deletePaycheck(id);
      const data = await getFinanceData();
      setFinanceData(data);
    } catch (error) {
      console.error("Failed to delete paycheck:", error);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await deleteExpense(id);
      const data = await getFinanceData();
      setFinanceData(data);
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  };

  const handleExportCSV = () => {
    if (!allCalendarDays.length) return;

    // CSV Header
    const headers = [
      "Date",
      "Day of Week",
      "Income",
      "Bills",
      "Expenses",
      "Net Change",
      "Balance",
      "Details",
    ];

    // Add summary section
    const summaryRows: string[][] = [];

    // Calculate monthly summaries
    for (let i = 0; i < monthsToShow; i++) {
      const displayMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + i,
        1,
      );
      const monthDays = calendarDays.filter(
        (day) =>
          day.date.getMonth() === displayMonth.getMonth() &&
          day.date.getFullYear() === displayMonth.getFullYear(),
      );

      const monthIncome = monthDays.reduce(
        (sum, day) => sum + day.paychecks.reduce((s, pc) => s + pc.amount, 0),
        0,
      );
      const monthBills = monthDays.reduce(
        (sum, day) => sum + day.bills.reduce((s, b) => s + b.amount, 0),
        0,
      );
      const monthExpenses = monthDays.reduce(
        (sum, day) => sum + day.expenses.reduce((s, e) => s + e.amount, 0),
        0,
      );

      const firstDay = monthDays[0];
      const lastDay = monthDays[monthDays.length - 1];

      summaryRows.push([
        displayMonth.toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
        "",
        monthIncome.toFixed(2),
        monthBills.toFixed(2),
        monthExpenses.toFixed(2),
        (monthIncome - monthBills - monthExpenses).toFixed(2),
        lastDay?.runningBalance.toFixed(2) || "0.00",
        `Start: $${firstDay?.runningBalance.toFixed(2) || "0.00"}, End: $${lastDay?.runningBalance.toFixed(2) || "0.00"}`,
      ]);
    }

    const csvSummary = [
      "MONTHLY SUMMARY",
      headers.join(","),
      ...summaryRows.map((row) => row.join(",")),
      "",
      "DAILY BREAKDOWN",
      headers.join(","),
    ].join("\n");

    // CSV Rows - use only displayed days for export
    const displayedDays = getDisplayDays();
    const rows = displayedDays.map((day) => {
      const dateStr = day.date.toISOString().split("T")[0];
      const dayOfWeek = day.date.toLocaleDateString("en-US", {
        weekday: "short",
      });

      const totalIncome = day.paychecks.reduce((sum, pc) => sum + pc.amount, 0);
      const totalBills = day.bills.reduce((sum, bill) => sum + bill.amount, 0);
      const totalExpenses = day.expenses.reduce(
        (sum, exp) => sum + exp.amount,
        0,
      );
      const netChange = totalIncome - totalBills - totalExpenses;

      // Create details string
      const details: string[] = [];
      day.paychecks.forEach((pc) =>
        details.push(`+$${pc.amount.toFixed(2)} (Paycheck)`),
      );
      day.bills.forEach((bill) =>
        details.push(`-$${bill.amount.toFixed(2)} (${bill.name})`),
      );
      day.expenses.forEach((exp) =>
        details.push(`-$${exp.amount.toFixed(2)} (${exp.name})`),
      );
      const detailsStr = details.join("; ");

      return [
        dateStr,
        dayOfWeek,
        totalIncome.toFixed(2),
        totalBills.toFixed(2),
        totalExpenses.toFixed(2),
        netChange.toFixed(2),
        day.runningBalance.toFixed(2),
        detailsStr,
      ];
    });

    // Combine summary and detailed rows
    const csvContent = [
      csvSummary,
      ...rows.map((row) =>
        row
          .map((cell) => {
            // Escape cells that contain commas
            if (cell.includes(",") || cell.includes('"')) {
              return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
          })
          .join(","),
      ),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    const startDate =
      calendarDays[0]?.date.toISOString().split("T")[0] || "start";
    const endDate =
      calendarDays[calendarDays.length - 1]?.date.toISOString().split("T")[0] ||
      "end";

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `balance-report-${startDate}-to-${endDate}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!financeData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-y-scroll h-full">
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
          <div className="flex items-center gap-2">
            <Label htmlFor="months-select" className="text-sm font-medium">
              Show:
            </Label>
            <Select
              value={monthsToShow.toString()}
              onValueChange={(v) => setMonthsToShow(Number.parseInt(v))}
            >
              <SelectTrigger id="months-select" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Month</SelectItem>
                <SelectItem value="2">2 Months</SelectItem>
                <SelectItem value="3">3 Months</SelectItem>
                <SelectItem value="4">4 Months</SelectItem>
                <SelectItem value="5">5 Months</SelectItem>
                <SelectItem value="6">6 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="container mx-auto flex items-center p-2 bg-card rounded-lg border">
          <div className="flex items-center justify-start gap-2 w-full">
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

            <Button size="sm" variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>

            <Link to="/settings/finance">
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Update Balance
              </Button>
            </Link>
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

        <div className="space-y-6">
          {/* Generate a card for each month in the view */}
          {Array.from(
            { length: monthsToShow },
            (_, monthOffset) => monthOffset,
          ).map((monthOffset) => {
            const displayMonth = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth() + monthOffset,
              1,
            );
            const year = displayMonth.getFullYear();
            const month = displayMonth.getMonth();
            const firstDayOfMonth = new Date(year, month, 1);
            const startDay = firstDayOfMonth.getDay();

            // Filter calendar days for this specific month
            const monthDays = calendarDays.filter(
              (day) =>
                day.date.getMonth() === month &&
                day.date.getFullYear() === year,
            );

            // Add padding days for the start of the month
            const paddingDays = Array(startDay).fill(null);

            return (
              <Card key={monthOffset}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5" />
                      {displayMonth.toLocaleString("default", {
                        month: "long",
                        year: "numeric",
                      })}
                    </CardTitle>
                    {monthOffset === 0 && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={previousMonth}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={nextMonth}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day) => (
                        <div
                          key={day}
                          className="text-center font-semibold text-sm text-muted-foreground py-2"
                        >
                          {day}
                        </div>
                      ),
                    )}

                    {/* Render padding days */}
                    {paddingDays.map((_, idx) => (
                      <div key={`padding-${idx}`} className="min-h-24" />
                    ))}

                    {/* Render actual days */}
                    {monthDays.map((day, idx) => {
                      const balanceAsOfDateStr =
                        financeData.account.balanceAsOfDate;
                      const [balanceYear, balanceMonth, balanceDay] =
                        balanceAsOfDateStr.split("-").map(Number);
                      const balanceAsOfDateDate = new Date(
                        balanceYear,
                        balanceMonth - 1,
                        balanceDay,
                      );
                      const isBeforeBalanceDate =
                        day.date < balanceAsOfDateDate;

                      return (
                        <div
                          key={idx}
                          className={`min-h-24 p-2 border rounded-lg bg-card ${
                            day.date.toDateString() ===
                            new Date().toDateString()
                              ? "ring-2 ring-primary"
                              : ""
                          } ${isBeforeBalanceDate ? "opacity-40" : ""}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-semibold text-foreground">
                              {day.date.getDate()}
                            </span>
                            {!isBeforeBalanceDate &&
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
                            {Array.isArray(day.paychecks) &&
                              day.paychecks.map((pc) => (
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

                            {Array.isArray(day.bills) &&
                              day.bills.map((bill) => (
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
                                          ${bill.amountPaid?.toFixed(0) || 0} /
                                          ${bill.total.toFixed(0)}
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

                            {Array.isArray(day.expenses) &&
                              day.expenses.map((exp) => (
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
                                      onClick={() =>
                                        handleDeleteExpense(exp.id)
                                      }
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
            );
          })}
        </div>
      </main>
    </div>
  );
}
