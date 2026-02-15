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
  exportCSV,
  getCategories,
  type CalendarDay as ApiCalendarDay,
  type Category,
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
  const [categories, setCategories] = useState<Category[]>([]);

  // Dialog states
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [paycheckDialogOpen, setPaycheckDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);

  // Form states
  const [billForm, setBillForm] = useState({
    name: "",
    amount: "",
    dueDay: "",
    category_id: "",
    total: "",
  });
  const [paycheckForm, setPaycheckForm] = useState({
    amount: "",
    date: "",
    frequency: "biweekly" as string,
    secondDay: "",
  });
  const [expenseForm, setExpenseForm] = useState({
    name: "",
    amount: "",
    date: "",
    category_id: "",
    relatedBillId: "none",
  });

  useEffect(() => {
    async function loadInitialData() {
      try {
        console.log("Starting to load finance data...");
        const data = await getFinanceData();
        console.log("Finance data loaded successfully:", data);
        setFinanceData(data);

        console.log("Loading categories...");
        const fetchedCategories = await getCategories();
        setCategories(fetchedCategories);
        console.log("Categories loaded:", fetchedCategories);

        if (fetchedCategories.length > 0) {
          const billCategory = fetchedCategories.find(
            (cat) => cat.type === "bill" || cat.type === "general",
          );
          if (billCategory) {
            setBillForm((prev) => ({
              ...prev,
              category_id: billCategory.id.toString(),
            }));
          }
          const expenseCategory = fetchedCategories.find(
            (cat) => cat.type === "expense" || cat.type === "general",
          );
          if (expenseCategory) {
            setExpenseForm((prev) => ({
              ...prev,
              category_id: expenseCategory.id.toString(),
            }));
          }
        }
      } catch (error: any) {
        console.error("Failed to load initial data:", error);
        if (
          error?.message?.includes("404") ||
          error?.message?.includes("Not Found")
        ) {
          console.log("No finance account found, redirecting to settings");
          window.location.href = "/settings";
        } else {
          alert(
            `Error loading finance data: ${error?.message || "Unknown error"}. Check console for details.`,
          );
        }
      }
    }
    loadInitialData();
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
        category_id: Number.parseInt(billForm.category_id),
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
        category_id:
          categories
            .find((cat) => cat.type === "bill" || cat.type === "general")
            ?.id.toString() || "",
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
        ...(paycheckForm.secondDay && {
          secondDayOfMonth: Number.parseInt(paycheckForm.secondDay),
        }),
      };

      await propagatePaychecks(paycheck);

      const data = await getFinanceData();
      setFinanceData(data);
      setPaycheckForm({
        amount: "",
        date: "",
        frequency: "biweekly",
        secondDay: "",
      });
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
        category_id: Number.parseInt(expenseForm.category_id),
        ...(expenseForm.relatedBillId !== "none" && {
          relatedBillId: Number.parseInt(expenseForm.relatedBillId),
        }),
      };
      await addExpense(expense);
      const data = await getFinanceData();
      setFinanceData(data);
      setExpenseForm({
        name: "",
        amount: "",
        date: "",
        category_id:
          categories
            .find((cat) => cat.type === "expense" || cat.type === "general")
            ?.id.toString() || "",
        relatedBillId: "none",
      });
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

  const handleExportCSV = async () => {
    if (!calendarDays.length) return;

    try {
      const startDate =
        calendarDays[0]?.date.toISOString().split("T")[0] || "start";
      const endDate =
        calendarDays[calendarDays.length - 1]?.date
          .toISOString()
          .split("T")[0] || "end";

      const blob = await exportCSV(startDate, endDate, monthsToShow);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `balance-report-${startDate}-to-${endDate}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export CSV:", error);
      alert("Failed to export CSV report. Please try again.");
    }
  };

  if (!financeData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <main className="container mx-auto p-6 flex flex-col gap-2 pb-14">
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
                      value={billForm.category_id}
                      onValueChange={(v) =>
                        setBillForm({ ...billForm, category_id: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter(
                            (cat) =>
                              cat.type === "bill" || cat.type === "general",
                          )
                          .map((category) => (
                            <SelectItem
                              key={category.id}
                              value={category.id.toString()}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
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

                  {paycheckForm.frequency === "bimonthly" && (
                    <div>
                      <Label htmlFor="secondDay">
                        Second Payday (Optional)
                      </Label>
                      <Input
                        id="secondDay"
                        type="number"
                        min="1"
                        max="31"
                        placeholder="Leave blank to use +15 days"
                        value={paycheckForm.secondDay}
                        onChange={(e) =>
                          setPaycheckForm({
                            ...paycheckForm,
                            secondDay: e.target.value,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        First payday is set by the "Start Date". This sets the
                        second payday of the month.
                      </p>
                    </div>
                  )}

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
                      value={expenseForm.category_id}
                      onValueChange={(v) =>
                        setExpenseForm({ ...expenseForm, category_id: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter(
                            (cat) =>
                              cat.type === "expense" || cat.type === "general",
                          )
                          .map((category) => (
                            <SelectItem
                              key={category.id}
                              value={category.id.toString()}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="relatedBill">
                      Apply Towards Bill (Optional)
                    </Label>
                    <Select
                      value={expenseForm.relatedBillId}
                      onValueChange={(v) =>
                        setExpenseForm({ ...expenseForm, relatedBillId: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {financeData?.recurringBills
                          .filter((bill) => bill.total) // Only show bills that have a total amount to pay off
                          .map((bill) => (
                            <SelectItem
                              key={bill.id}
                              value={bill.id.toString()}
                            >
                              {bill.name} (Total: ${bill.total})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      If this expense is a payment towards a debt/bill (like a
                      credit card), select it here to update the remaining
                      balance.
                    </p>
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
                                  className="text-xs bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded flex items-center justify-between group"
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
                              day.bills.map((bill) => {
                                const color =
                                  bill.category?.color || "gray-500";
                                const colorVar = `var(--color-${color})`;

                                return (
                                  <div
                                    key={bill.id}
                                    style={{
                                      color: colorVar,
                                      backgroundColor: `color-mix(in srgb, ${colorVar}, transparent 90%)`,
                                    }}
                                    className="text-xs px-1.5 py-0.5 rounded group mb-1"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">
                                          {bill.name}
                                        </div>
                                        <div className="text-[10px]">
                                          -${bill.amount.toFixed(0)}
                                        </div>
                                        {bill.total && (
                                          <div className="text-[10px] font-semibold">
                                            ${bill.amountPaid?.toFixed(0) || 0}{" "}
                                            / ${bill.total.toFixed(0)}
                                          </div>
                                        )}
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleDeleteBill(bill.id)
                                        }
                                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}

                            {Array.isArray(day.expenses) &&
                              day.expenses.map((exp) => {
                                const color = exp.category?.color || "gray-500";
                                const colorVar = `var(--color-${color})`;

                                return (
                                  <div
                                    key={exp.id}
                                    style={{
                                      color: colorVar,
                                      backgroundColor: `color-mix(in srgb, ${colorVar}, transparent 90%)`,
                                    }}
                                    className="text-xs px-1.5 py-0.5 rounded group mb-1"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1 min-w-0">
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
                                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
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
