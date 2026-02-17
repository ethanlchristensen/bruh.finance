import { useState, useEffect, useCallback } from "react";
import {
  getFinanceData,
  getCalendarData,
  getCategories,
  type CalendarDay,
  type Category,
  type FinanceData,
} from "@/lib/finance-api";

export function useDashboardData() {
  const [financeData, setFinanceData] = useState<FinanceData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calendar view state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthsToShow, setMonthsToShow] = useState(3);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [data, fetchedCategories] = await Promise.all([
        getFinanceData(),
        getCategories(),
      ]);

      setFinanceData(data);
      setCategories(fetchedCategories);
    } catch (err: any) {
      console.error("Failed to load initial data:", err);
      if (
        err?.message?.includes("404") ||
        err?.message?.includes("Not Found")
      ) {
        // Redirect logic should probably be handled by the component or a router guard
        // but we'll return a specific error string for now
        setError("NO_ACCOUNT");
      } else {
        setError(err?.message || "Unknown error");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load calendar data when financeData or view settings change
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

        const data = await getCalendarData(startDateStr, endDateStr, 24);
        setCalendarDays(data);
      } catch (err) {
        console.error("Failed to load calendar data:", err);
      }
    };

    loadCalendarData();
  }, [financeData, currentDate, monthsToShow]);

  // Derived state for display
  const displayDays = calendarDays.filter((day) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dayYear = day.date.getFullYear();
    const dayMonth = day.date.getMonth();

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

  return {
    financeData,
    categories,
    calendarDays: displayDays, // Return filtered days
    allCalendarDays: calendarDays, // Return raw days if needed
    isLoading,
    error,
    currentDate,
    monthsToShow,
    setMonthsToShow,
    setCurrentDate,
    refreshData: loadData,
  };
}
