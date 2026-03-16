import React from "react";
import { importCSV, exportCSV, type CalendarDay } from "@/lib/finance-api";

export function useActionButtons(
  onDataRefresh: () => Promise<void>,
  calendarDays: CalendarDay[],
  monthsToShow: number,
) {
  const handleCSVImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importCSV(file);
      await onDataRefresh();
      event.target.value = "";
    } catch (error) {
      console.error("Failed to import CSV:", error);
      alert(
        "Failed to import CSV. Please check the file format and try again.",
      );
      event.target.value = "";
    }
  };

  const handleExportCSV = async (includeAllDays: boolean = true) => {
    if (!calendarDays.length) return;

    try {
      const startDate =
        calendarDays[0]?.date.toISOString().split("T")[0] || "start";
      const endDate =
        calendarDays[calendarDays.length - 1]?.date
          .toISOString()
          .split("T")[0] || "end";

      const blob = await exportCSV(
        startDate,
        endDate,
        monthsToShow,
        includeAllDays,
      );

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

  return {
    handleCSVImport,
    handleExportCSV,
  };
}
