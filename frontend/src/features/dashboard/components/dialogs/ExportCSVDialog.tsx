import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download } from "lucide-react";
import { useState } from "react";

interface ExportCSVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (includeAllDays: boolean) => Promise<void>;
}

export function ExportCSVDialog({
  open,
  onOpenChange,
  onExport,
}: ExportCSVDialogProps) {
  const [includeAllDays, setIncludeAllDays] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(includeAllDays === "all");
      onOpenChange(false);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Balance Report</DialogTitle>
          <DialogDescription>
            Choose which days to include in your CSV export
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={includeAllDays} onValueChange={setIncludeAllDays}>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="all" id="all" />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="all"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Include all days
                </Label>
                <p className="text-sm text-muted-foreground">
                  Export will include every day in the date range, even days
                  with no transactions
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="active" id="active" />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="active"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Only days with activity
                </Label>
                <p className="text-sm text-muted-foreground">
                  Export will only include days with paychecks, bills, expenses,
                  or savings transactions
                </p>
              </div>
            </div>
          </RadioGroup>

          <Button
            onClick={handleExport}
            className="w-full"
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
