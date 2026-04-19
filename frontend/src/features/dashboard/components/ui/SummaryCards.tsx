import { Card, CardContent } from "@/components/ui/card";
import { type CalendarDay, type FinanceData } from "@/lib/finance-api";
import { useSummaryCards } from "./hooks/summary-cards/useSummaryCards";

interface SummaryCardsProps {
  financeData: FinanceData;
  calendarDays: CalendarDay[];
  currentDate: Date;
  allCalendarDays: CalendarDay[];
}

export function SummaryCards({
  financeData,
  calendarDays,
  currentDate,
  allCalendarDays,
}: SummaryCardsProps) {
  const {
    currentBalanceDisplay,
    currentMonthEndDay,
    projectedSavingsBalance,
    currentSavingsBalanceDisplay,
  } = useSummaryCards(financeData, calendarDays, currentDate, allCalendarDays);

  return (
    <Card className="w-full shrink-0 px-2 py-4 bg-transparent border-none">
      <CardContent>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-8">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Current Balance
            </span>
            <span className="text-3xl font-bold">
              ${currentBalanceDisplay.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Month End Balance
            </span>
            <span
              className={`text-3xl font-bold ${(currentMonthEndDay?.runningBalance ?? 0) >= 0 ? "text-primary" : "text-destructive"}`}
            >
              ${(currentMonthEndDay?.runningBalance ?? 0).toFixed(2)}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Unaccounted Spending
            </span>
            <span className="text-3xl font-bold text-destructive">
              ${financeData.unaccountedSpending.toFixed(2)}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1">
              Expenses not tied to bills this month
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Savings Balance
            </span>
            <span className="text-3xl font-bold">
              ${currentSavingsBalanceDisplay.toFixed(2)}
            </span>
            <div className="flex gap-2 mt-1">
              <span
                className={`text-xs ${projectedSavingsBalance >= currentSavingsBalanceDisplay ? "text-primary" : "text-destructive"}`}
              >
                Projected: ${projectedSavingsBalance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
