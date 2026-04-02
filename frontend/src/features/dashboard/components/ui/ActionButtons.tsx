import { Upload, Download, Settings } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { type CalendarDay } from "@/lib/finance-api";
import { useActionButtons } from "./hooks/action-buttons/useActionButtons";
import { ExportCSVDialog } from "../dialogs/ExportCSVDialog";
import { useState, useRef } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  onDataRefresh: () => Promise<void>;
  calendarDays: CalendarDay[];
  monthsToShow: number;
  asMenuItems?: boolean;
}

export function ActionButtons({
  onDataRefresh,
  calendarDays,
  monthsToShow,
  asMenuItems = false,
}: ActionButtonsProps) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { handleCSVImport, handleExportCSV } = useActionButtons(
    onDataRefresh,
    calendarDays,
    monthsToShow,
  );

  if (asMenuItems) {
    return (
      <>
        <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setExportDialogOpen(true)}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </DropdownMenuItem>
        <Link to="/settings">
          <DropdownMenuItem>
            <Settings className="h-4 w-4 mr-2" />
            Update Balance
          </DropdownMenuItem>
        </Link>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleCSVImport}
        />

        <ExportCSVDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          onExport={handleExportCSV}
        />
      </>
    );
  }

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

      <Button
        size="sm"
        variant="outline"
        onClick={() => setExportDialogOpen(true)}
      >
        <Download className="h-4 w-4 mr-2" />
        Export Report
      </Button>

      <ExportCSVDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExport={handleExportCSV}
      />

      <Link to="/settings">
        <Button size="sm" variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Update Balance
        </Button>
      </Link>
    </>
  );
}
