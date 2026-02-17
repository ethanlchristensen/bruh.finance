import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  } = useSummaryCards(
    financeData,
    calendarDays,
    currentDate,
    allCalendarDays
  );

  return (
    <div className="grid gap-6 md:grid-cols-4 mb-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Current Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            ${currentBalanceDisplay.toFixed(2)}
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
            Checking Month End Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`text-3xl font-bold ${
              (currentMonthEndDay?.runningBalance ?? 0) >= 0
                ? "text-primary"
                : "text-destructive"
            }`}
          >
            ${(currentMonthEndDay?.runningBalance ?? 0).toFixed(2)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Savings Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            ${financeData.savingsAccount.currentBalance.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Started with $
            {financeData.savingsAccount.startingBalance.toFixed(2)}
          </p>
          <p
            className={`text-xs mt-1 ${
              projectedSavingsBalance >=
              financeData.savingsAccount.currentBalance
                ? "text-primary"
                : "text-destructive"
            }`}
          >
            Projected end of month: ${projectedSavingsBalance.toFixed(2)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
