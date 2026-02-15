import type { RecurringBill } from "@/lib/finance-api";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Pencil, Trash2 } from "lucide-react";

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

interface BillRowProps {
  bill: RecurringBill;
  onEdit: (bill: RecurringBill) => void;
  onDelete: (bill: RecurringBill) => void;
}

export function BillRow({ bill, onEdit, onDelete }: BillRowProps) {
  const paidPercent =
    bill.total && bill.amountPaid
      ? Math.round((bill.amountPaid / bill.total) * 100)
      : 0;

  // 1. Get the category color (e.g., "rose-500")
  const color = bill.category?.color || "gray-500";
  // 2. Create the CSS variable reference
  const colorVar = `var(--color-${color})`;

  return (
    <TableRow className="group">
      <TableCell>
        <div className="flex items-center gap-3">
          <div
            // 3. Apply color to the status dot
            style={{ backgroundColor: colorVar }}
            className="h-3 w-3 shrink-0 rounded-full"
            aria-hidden="true"
          />
          <span className="font-medium">{bill.name}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          // 4. Apply the paycheck-style coloring to the Badge
          style={{
            color: colorVar,
            backgroundColor: `color-mix(in srgb, ${colorVar}, transparent 90%)`,
            borderColor: `color-mix(in srgb, ${colorVar}, transparent 80%)`,
          }}
          className="text-xs font-medium border"
        >
          {bill.category?.name || "Uncategorized"}
        </Badge>
      </TableCell>
      {/* ... rest of the component remains the same ... */}
      <TableCell className="font-mono text-sm">
        ${bill.amount.toFixed(2)}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {bill.dueDay}
        {getOrdinalSuffix(bill.dueDay)} of each month
      </TableCell>
      <TableCell>
        {bill.total != null && bill.amountPaid != null ? (
          <div className="flex items-center gap-3">
            <Progress value={paidPercent} className="h-1.5 w-20" />
            <span className="text-xs tabular-nums text-muted-foreground">
              {paidPercent}%
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">--</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(bill)}
            aria-label={`Edit ${bill.name}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(bill)}
            aria-label={`Delete ${bill.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
