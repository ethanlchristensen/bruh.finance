import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getFinanceData } from "@/lib/finance-storage";
import type { RecurringBill, Paycheck, Expense } from "@/lib/types";

interface PayPeriod {
  startDate: Date;
  endDate: Date;
  paycheck: Paycheck;
  essentialBills: RecurringBill[];
  expenses: Expense[];
  priorityPayments: { bill: RecurringBill; amount: number }[];
  totalIncome: number;
  totalEssential: number;
  totalExpenses: number;
  totalPriority: number;
  discretionaryAmount: number;
}

interface BillPriority {
  billId: string;
  monthlyExtraPayment: number;
}

export default function PriorityPage() {
  const [financeData, setFinanceData] =
    useState<ReturnType<typeof getFinanceData>>(null);
  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [priorities, setPriorities] = useState<BillPriority[]>([]);

  useEffect(() => {
    const data = getFinanceData();
    if (!data) {
      window.location.href = "/setup";
      return;
    }
    setFinanceData(data);

    // Load saved priorities
    const savedPriorities = localStorage.getItem("billPriorities");
    if (savedPriorities) {
      setPriorities(JSON.parse(savedPriorities));
    }
  }, []);

  useEffect(() => {
    if (financeData) {
      calculatePayPeriods();
    }
  }, [financeData, priorities]);

  const calculatePayPeriods = () => {
    if (!financeData) return;

    // Get next 3 months of paychecks
    const today = new Date();
    const threeMonthsFromNow = new Date(today);
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    const upcomingPaychecks = financeData.paychecks
      .map((pc) => {
        const [year, month, day] = pc.date.split("-").map(Number);
        return { ...pc, dateObj: new Date(year, month - 1, day) };
      })
      .filter((pc) => pc.dateObj >= today && pc.dateObj <= threeMonthsFromNow)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    const periods: PayPeriod[] = [];

    for (let i = 0; i < upcomingPaychecks.length; i++) {
      const currentPaycheck = upcomingPaychecks[i];
      const nextPaycheck = upcomingPaychecks[i + 1];

      const startDate = currentPaycheck.dateObj;
      const endDate = nextPaycheck
        ? new Date(nextPaycheck.dateObj.getTime() - 1)
        : new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);

      // Get bills in this period
      const billsInPeriod = getBillsInDateRange(startDate, endDate);

      // Get expenses in this period
      const expensesInPeriod = getExpensesInDateRange(startDate, endDate);

      // Calculate priority payments
      const priorityPayments = priorities
        .map((priority) => {
          const bill = financeData.recurringBills.find(
            (b) => b.id === priority.billId,
          );
          if (!bill || !bill.total) return null;

          const remaining = bill.total - (bill.amountPaid || 0);
          const amount = Math.min(priority.monthlyExtraPayment, remaining);

          return { bill, amount };
        })
        .filter((p) => p !== null) as { bill: RecurringBill; amount: number }[];

      const totalIncome = currentPaycheck.amount;
      const totalEssential = billsInPeriod.reduce(
        (sum, b) => sum + b.amount,
        0,
      );
      const totalExpenses = expensesInPeriod.reduce(
        (sum, e) => sum + e.amount,
        0,
      );
      const totalPriority = priorityPayments.reduce(
        (sum, p) => sum + p.amount,
        0,
      );
      const discretionaryAmount =
        totalIncome - totalEssential - totalExpenses - totalPriority;

      periods.push({
        startDate,
        endDate,
        paycheck: currentPaycheck,
        essentialBills: billsInPeriod,
        expenses: expensesInPeriod,
        priorityPayments,
        totalIncome,
        totalEssential,
        totalExpenses,
        totalPriority,
        discretionaryAmount,
      });
    }

    setPayPeriods(periods);
  };

  const getBillsInDateRange = (start: Date, end: Date): RecurringBill[] => {
    if (!financeData) return [];

    const bills: RecurringBill[] = [];
    const current = new Date(start);

    while (current <= end) {
      const dayBills = financeData.recurringBills.filter((bill) => {
        const isCorrectDay = bill.dueDay === current.getDate();
        const isPaidOff =
          bill.total && bill.amountPaid && bill.amountPaid >= bill.total;
        return isCorrectDay && !isPaidOff;
      });

      bills.push(...dayBills);
      current.setDate(current.getDate() + 1);
    }

    return bills;
  };

  const getExpensesInDateRange = (start: Date, end: Date): Expense[] => {
    if (!financeData) return [];

    return financeData.expenses.filter((exp) => {
      const [year, month, day] = exp.date.split("-").map(Number);
      const expDate = new Date(year, month - 1, day);
      return expDate >= start && expDate <= end;
    });
  };

  const handlePriorityChange = (billId: string, amount: string) => {
    const numAmount = Number.parseFloat(amount) || 0;
    const existingIndex = priorities.findIndex((p) => p.billId === billId);

    let newPriorities: BillPriority[];
    if (existingIndex >= 0) {
      if (numAmount === 0) {
        newPriorities = priorities.filter((p) => p.billId !== billId);
      } else {
        newPriorities = [...priorities];
        newPriorities[existingIndex] = {
          billId,
          monthlyExtraPayment: numAmount,
        };
      }
    } else if (numAmount > 0) {
      newPriorities = [
        ...priorities,
        { billId, monthlyExtraPayment: numAmount },
      ];
    } else {
      newPriorities = priorities;
    }

    setPriorities(newPriorities);
    localStorage.setItem("billPriorities", JSON.stringify(newPriorities));
  };

  const getPriorityAmount = (billId: string): number => {
    return (
      priorities.find((p) => p.billId === billId)?.monthlyExtraPayment || 0
    );
  };

  if (!financeData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const billsWithTotal = financeData.recurringBills.filter((b) => b.total);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6 flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">
          Payment Priorities & Budget Planning
        </h1>
        <Tabs defaultValue="priorities" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="priorities" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Payment Priorities
            </TabsTrigger>
            <TabsTrigger value="paychecks" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Paycheck View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="priorities" className="space-y-6 mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Priority Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Set Payment Priorities</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Set extra payment amounts for bills you want to pay off
                    faster
                  </p>
                </CardHeader>
                <CardContent>
                  {billsWithTotal.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No bills with payoff amounts found. Add bills with a total
                      amount to prioritize paying them off.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {billsWithTotal.map((bill) => {
                        const remaining = bill.total! - (bill.amountPaid || 0);
                        return (
                          <div
                            key={bill.id}
                            className="flex flex-col gap-2 border p-4 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{bill.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  Regular: ${bill.amount.toFixed(2)}/month
                                </div>
                                <div className="text-sm font-semibold text-primary">
                                  Remaining: ${remaining.toFixed(2)}
                                </div>
                              </div>
                              <Badge variant="outline">{bill.category}</Badge>
                            </div>
                            <div>
                              <Label
                                htmlFor={`priority-${bill.id}`}
                                className="mb-2"
                              >
                                Extra Monthly Payment
                              </Label>
                              <Input
                                id={`priority-${bill.id}`}
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={getPriorityAmount(bill.id) || ""}
                                onChange={(e) =>
                                  handlePriorityChange(bill.id, e.target.value)
                                }
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Next 3 Months Overview</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    See how your priority payments affect your budget
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Total Income
                        </p>
                        <p className="text-2xl font-bold text-[hsl(var(--chart-2))]">
                          $
                          {payPeriods
                            .reduce((sum, p) => sum + p.totalIncome, 0)
                            .toFixed(2)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Priority Payments
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          $
                          {payPeriods
                            .reduce((sum, p) => sum + p.totalPriority, 0)
                            .toFixed(2)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Essential Bills
                        </p>
                        <p className="text-2xl font-bold text-destructive">
                          $
                          {payPeriods
                            .reduce((sum, p) => sum + p.totalEssential, 0)
                            .toFixed(2)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Discretionary
                        </p>
                        <p className="text-2xl font-bold text-[hsl(var(--chart-3))]">
                          $
                          {payPeriods
                            .reduce((sum, p) => sum + p.discretionaryAmount, 0)
                            .toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {priorities.length > 0 && (
                      <div className="pt-4 border-t">
                        <h4 className="font-semibold mb-2">
                          Active Priorities:
                        </h4>
                        <div className="space-y-2">
                          {priorities.map((priority) => {
                            const bill = billsWithTotal.find(
                              (b) => b.id === priority.billId,
                            );
                            if (!bill) return null;
                            const remaining =
                              bill.total! - (bill.amountPaid || 0);
                            const monthsToPayoff = Math.ceil(
                              remaining / priority.monthlyExtraPayment,
                            );
                            return (
                              <div
                                key={priority.billId}
                                className="flex justify-between items-center text-sm"
                              >
                                <span className="font-medium">{bill.name}</span>
                                <div className="text-right">
                                  <div className="font-semibold text-primary">
                                    +${priority.monthlyExtraPayment.toFixed(2)}
                                    /mo
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    ~{monthsToPayoff} months to payoff
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="paychecks" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Pay Period Breakdown</h2>
                <Badge variant="secondary" className="text-lg">
                  {payPeriods.length} upcoming paychecks
                </Badge>
              </div>

              {payPeriods.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      No upcoming paychecks found. Add a paycheck on the
                      dashboard to see your budget breakdown.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                payPeriods.map((period, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            Pay Period {idx + 1}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {period.startDate.toLocaleDateString()} -{" "}
                            {period.endDate.toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-lg">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {period.totalIncome.toFixed(2)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Breakdown bars */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Essential Bills</span>
                            <span className="font-semibold text-destructive">
                              -${period.totalEssential.toFixed(2)}
                            </span>
                          </div>
                          {period.essentialBills.length > 0 && (
                            <div className="pl-4 space-y-1">
                              {period.essentialBills.map((bill) => (
                                <div
                                  key={bill.id}
                                  className="flex justify-between text-xs text-muted-foreground"
                                >
                                  <span>{bill.name}</span>
                                  <span>${bill.amount.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {period.totalExpenses > 0 && (
                            <>
                              <div className="flex items-center justify-between text-sm pt-2">
                                <span className="font-medium">Expenses</span>
                                <span className="font-semibold text-[hsl(var(--chart-4))]">
                                  -${period.totalExpenses.toFixed(2)}
                                </span>
                              </div>
                              <div className="pl-4 space-y-1">
                                {period.expenses.map((exp) => (
                                  <div
                                    key={exp.id}
                                    className="flex justify-between text-xs text-muted-foreground"
                                  >
                                    <span>{exp.name}</span>
                                    <span>${exp.amount.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}

                          {period.priorityPayments.length > 0 && (
                            <>
                              <div className="flex items-center justify-between text-sm pt-2">
                                <span className="flex items-center gap-1 font-medium">
                                  <TrendingUp className="h-4 w-4" />
                                  Priority Payments
                                </span>
                                <span className="font-semibold text-primary">
                                  -${period.totalPriority.toFixed(2)}
                                </span>
                              </div>
                              <div className="pl-4 space-y-1">
                                {period.priorityPayments.map((pp) => (
                                  <div
                                    key={pp.bill.id}
                                    className="flex justify-between text-xs text-muted-foreground"
                                  >
                                    <span>{pp.bill.name} (extra)</span>
                                    <span>${pp.amount.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}

                          <div className="pt-3 border-t">
                            <div className="flex items-center justify-between font-bold text-lg">
                              <span>Discretionary Available</span>
                              <span
                                className={
                                  period.discretionaryAmount >= 0
                                    ? "text-[hsl(var(--chart-2))]"
                                    : "text-destructive"
                                }
                              >
                                ${period.discretionaryAmount.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Visual bar */}
                        <div className="w-full h-10 flex rounded-lg overflow-hidden shadow-sm">
                          {period.totalEssential > 0 && (
                            <div
                              className="bg-red-500 flex items-center justify-center text-white text-xs font-semibold"
                              style={{
                                width: `${Math.max(
                                  (period.totalEssential / period.totalIncome) *
                                    100,
                                  5,
                                )}%`,
                              }}
                              title={`Essential Bills: ${((period.totalEssential / period.totalIncome) * 100).toFixed(1)}%`}
                            >
                              {(
                                (period.totalEssential / period.totalIncome) *
                                100
                              ).toFixed(0)}
                              %
                            </div>
                          )}
                          {period.totalExpenses > 0 && (
                            <div
                              className="bg-red-500 flex items-center justify-center text-white text-xs font-semibold"
                              style={{
                                width: `${Math.max(
                                  (period.totalExpenses / period.totalIncome) *
                                    100,
                                  5,
                                )}%`,
                              }}
                              title={`Expenses: ${((period.totalExpenses / period.totalIncome) * 100).toFixed(1)}%`}
                            >
                              {(
                                (period.totalExpenses / period.totalIncome) *
                                100
                              ).toFixed(0)}
                              %
                            </div>
                          )}
                          {period.totalPriority > 0 && (
                            <div
                              className="bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold"
                              style={{
                                width: `${Math.max(
                                  (period.totalPriority / period.totalIncome) *
                                    100,
                                  5,
                                )}%`,
                              }}
                              title={`Priority Payments: ${((period.totalPriority / period.totalIncome) * 100).toFixed(1)}%`}
                            >
                              {(
                                (period.totalPriority / period.totalIncome) *
                                100
                              ).toFixed(0)}
                              %
                            </div>
                          )}
                          {period.discretionaryAmount > 0 && (
                            <div
                              className="bg-emerald-500 flex items-center justify-center text-white text-xs font-semibold"
                              style={{
                                width: `${Math.max(
                                  (period.discretionaryAmount /
                                    period.totalIncome) *
                                    100,
                                  5,
                                )}%`,
                              }}
                              title={`Discretionary: ${((period.discretionaryAmount / period.totalIncome) * 100).toFixed(1)}%`}
                            >
                              {(
                                (period.discretionaryAmount /
                                  period.totalIncome) *
                                100
                              ).toFixed(0)}
                              %
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
