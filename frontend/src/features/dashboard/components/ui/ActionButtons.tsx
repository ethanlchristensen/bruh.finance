import { Upload, Download, Settings } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { type CalendarDay } from "@/lib/finance-api";
import { useActionButtons } from "./hooks/action-buttons/useActionButtons";
import { ExportCSVDialog } from "../dialogs/ExportCSVDialog";
import { ImportCSVDialog } from "../dialogs/ImportCSVDialog";
import { useState } from "react";
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
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const { handleFileImport, handleExportCSV } = useActionButtons(
    onDataRefresh,
    calendarDays,
    monthsToShow,
  );

  if (asMenuItems) {
    return (
      <>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setImportDialogOpen(true);
          }}
        >
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setExportDialogOpen(true);
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </DropdownMenuItem>
        <Link to="/settings">
          <DropdownMenuItem>
            <Settings className="h-4 w-4 mr-2" />
            Update Balance
          </DropdownMenuItem>
        </Link>

        <ImportCSVDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onImport={handleFileImport}
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
      <Button
        size="sm"
        variant="outline"
        onClick={() => setImportDialogOpen(true)}
      >
        <Upload className="h-4 w-4 mr-2" />
        Import CSV
      </Button>

      <ImportCSVDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleFileImport}
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
