import {
  type CalendarDay,
  type FinanceData,
} from "@/lib/finance-api";

export function useSummaryCards(
  financeData: FinanceData,
  calendarDays: CalendarDay[],
  currentDate: Date,
  allCalendarDays: CalendarDay[],
) {
  const currentMonthEndDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  );

  const currentMonthEndDay = calendarDays.find(
    (day) =>
      day.date.getFullYear() === currentMonthEndDate.getFullYear() &&
      day.date.getMonth() === currentMonthEndDate.getMonth() &&
      day.date.getDate() === currentMonthEndDate.getDate(),
  );

  const projectedSavingsBalance =
    typeof currentMonthEndDay?.savingsRunningBalance === "number"
      ? currentMonthEndDay.savingsRunningBalance
      : financeData.savingsAccount.currentBalance;

  const today = new Date();
  const todayData = allCalendarDays.find(
    (day) =>
      day.date.getDate() === today.getDate() &&
      day.date.getMonth() === today.getMonth() &&
      day.date.getFullYear() === today.getFullYear(),
  );

  const currentBalanceDisplay = todayData
    ? todayData.runningBalance
    : financeData.account.currentBalance;

  return {
    currentBalanceDisplay,
    currentMonthEndDay,
    projectedSavingsBalance,
  };
}
