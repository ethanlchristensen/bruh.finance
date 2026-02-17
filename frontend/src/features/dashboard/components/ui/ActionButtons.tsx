import { Button } from "@/components/ui/button";
import { Upload, Download, Settings } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { type CalendarDay } from "@/lib/finance-api";
import { useActionButtons } from "./hooks/action-buttons/useActionButtons";

interface ActionButtonsProps {
  onDataRefresh: () => Promise<void>;
  calendarDays: CalendarDay[];
  monthsToShow: number;
}

export function ActionButtons({
  onDataRefresh,
  calendarDays,
  monthsToShow,
}: ActionButtonsProps) {
  const { handleCSVImport, handleExportCSV } = useActionButtons(
    onDataRefresh,
    calendarDays,
    monthsToShow,
  );

  return (
    <>
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

      <Link to="/settings">
        <Button size="sm" variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Update Balance
        </Button>
      </Link>
    </>
  );
}
