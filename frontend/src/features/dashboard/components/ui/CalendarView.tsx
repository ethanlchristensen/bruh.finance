import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarIcon, Trash2 } from "lucide-react";
import type { CalendarDay } from "@/lib/finance-api";

interface CalendarViewProps {
  currentDate: Date;
  monthsToShow: number;
  calendarDays: CalendarDay[];
  balanceAsOfDateStr: string;
  onDeleteBill: (id: number) => Promise<void>;
  onDeletePaycheck: (id: number) => Promise<void>;
  onDeleteExpense: (id: number) => Promise<void>;
  onDeleteSavingsTransaction: (id: number) => Promise<void>;
}

export function CalendarView({
  currentDate,
  monthsToShow,
  calendarDays,
  balanceAsOfDateStr,
  onDeleteBill,
  onDeletePaycheck,
  onDeleteExpense,
  onDeleteSavingsTransaction,
}: CalendarViewProps) {
  return (
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
            day.date.getMonth() === month && day.date.getFullYear() === year,
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
                  const [balanceYear, balanceMonth, balanceDay] =
                    balanceAsOfDateStr.split("-").map(Number);
                  const balanceAsOfDateDate = new Date(
                    balanceYear,
                    balanceMonth - 1,
                    balanceDay,
                  );
                  const isBeforeBalanceDate = day.date < balanceAsOfDateDate;

                  return (
                    <div
                      key={idx}
                      className={`min-h-24 p-2 border rounded-lg bg-card ${
                        day.date.toDateString() === new Date().toDateString()
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
                            day.expenses.length > 0 ||
                            day.savingsTransactions.length > 0) && (
                            <div className="flex flex-col items-end leading-none gap-0.5">
                              <span
                                className={`text-xs font-bold ${
                                  day.runningBalance >= 0
                                    ? "text-primary"
                                    : "text-destructive"
                                }`}
                              >
                                ${day.runningBalance.toFixed(0)}
                              </span>
                              {day.savingsTransactions.length > 0 && (
                                <span className="text-[10px] font-medium text-amber-600 dark:text-amber-500">
                                  Sav: ${day.savingsRunningBalance.toFixed(0)}
                                </span>
                              )}
                            </div>
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
                                onClick={() => onDeletePaycheck(pc.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}

                        {Array.isArray(day.bills) &&
                          day.bills.map((bill) => {
                            const color = bill.category?.color || "gray-500";
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
                                        ${bill.amountPaid?.toFixed(0) || 0} / $
                                        {bill.total.toFixed(0)}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => onDeleteBill(bill.id)}
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
                                    onClick={() => onDeleteExpense(exp.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                        {Array.isArray(day.savingsTransactions) &&
                          day.savingsTransactions.map((txn) => {
                            const isTransfer =
                              txn.transactionType === "transfer_to_checking";
                            const isRecurring = Boolean(txn.isRecurring);
                            const wrapperClass = isTransfer
                              ? "bg-sky-500/10 text-sky-500"
                              : isRecurring
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-fuchsia-500/10 text-fuchsia-500";
                            const amountPrefix = isTransfer ? "+" : "-";
                            const label =
                              txn.source ??
                              (isTransfer
                                ? "Savings → Checking"
                                : isRecurring
                                  ? "Scheduled Savings"
                                  : "Savings Deposit");
                            const detail =
                              txn.notes ||
                              (isRecurring
                                ? "Recurring contribution"
                                : undefined);

                            return (
                              <div
                                key={`savings-${txn.id}`}
                                className={`text-xs px-1.5 py-0.5 rounded group mb-1 ${wrapperClass}`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">
                                      {label}
                                    </div>
                                    <div className="text-[10px] font-semibold">
                                      {amountPrefix}${txn.amount.toFixed(0)}
                                    </div>
                                    {detail && (
                                      <div className="text-[10px] opacity-80 truncate">
                                        {detail}
                                      </div>
                                    )}
                                  </div>
                                  {!isRecurring && (
                                    <button
                                      onClick={() =>
                                        onDeleteSavingsTransaction(txn.id)
                                      }
                                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0"
                                      aria-label="Delete savings transaction"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  )}
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
  );
}
