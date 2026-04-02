import type { Expense } from "@/lib/finance-api";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface ExpenseRowProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export function ExpenseRow({ expense, onEdit, onDelete }: ExpenseRowProps) {
  // 1. Get the category color (e.g., "rose-500")
  const color = expense.category?.color || "gray-500";
  // 2. Create the CSS variable reference
  const colorVar = `var(--color-${color})`;

  return (
    <TableRow className="group">
      <TableCell>
        <div className="flex items-center gap-3">
          <div
            style={{ backgroundColor: colorVar }}
            className="h-3 w-3 shrink-0 rounded-full"
            aria-hidden="true"
          />
          <span className="font-medium">{expense.name}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          style={{
            color: colorVar,
            backgroundColor: `color-mix(in srgb, ${colorVar}, transparent 90%)`,
            borderColor: `color-mix(in srgb, ${colorVar}, transparent 80%)`,
          }}
          className="text-xs font-medium border"
        >
          {expense.category?.name || "Uncategorized"}
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-sm">
        ${expense.amount.toFixed(2)}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {format(new Date(expense.date), "MMM d, yyyy")}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(expense)}
            aria-label={`Edit ${expense.name}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(expense)}
            aria-label={`Delete ${expense.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
