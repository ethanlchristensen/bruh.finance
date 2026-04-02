import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { type Category, type RecurringBill } from "@/lib/finance-api";
import { useExpenseDialog } from "./hooks/expense-dialog/useExpenseDialog";

interface ExpenseDialogProps {
  categories: Category[];
  recurringBills: RecurringBill[];
  onSuccess: () => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showTrigger?: boolean;
}

export function ExpenseDialog({
  categories,
  recurringBills,
  onSuccess,
  open,
  onOpenChange,
  showTrigger = true,
}: ExpenseDialogProps) {
  const { expenseForm, setExpenseForm, handleAddExpense } = useExpenseDialog(
    categories,
    onSuccess,
    onOpenChange,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Expense
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add One-Time Expense</DialogTitle>
          <DialogDescription>
            Add expenses like groceries, gas, eating out, etc.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="expenseName">Expense Name</Label>
            <Input
              id="expenseName"
              placeholder="Groceries"
              value={expenseForm.name}
              onChange={(e) =>
                setExpenseForm({ ...expenseForm, name: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="expenseAmount">Amount</Label>
            <Input
              id="expenseAmount"
              type="number"
              step="0.01"
              placeholder="75.50"
              value={expenseForm.amount}
              onChange={(e) =>
                setExpenseForm({
                  ...expenseForm,
                  amount: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="expenseDate">Date</Label>
            <Input
              id="expenseDate"
              type="date"
              value={expenseForm.date}
              onChange={(e) =>
                setExpenseForm({ ...expenseForm, date: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="expenseCategory">Category</Label>
            <Select
              value={expenseForm.category_id}
              onValueChange={(v) =>
                setExpenseForm({ ...expenseForm, category_id: v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter(
                    (cat) => cat.type === "expense" || cat.type === "general",
                  )
                  .map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="relatedBill">Apply Towards Bill (Optional)</Label>
            <Select
              value={expenseForm.relatedBillId}
              onValueChange={(v) =>
                setExpenseForm({ ...expenseForm, relatedBillId: v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {recurringBills
                  .filter((bill) => bill.total) // Only show bills that have a total amount to pay off
                  .map((bill) => (
                    <SelectItem key={bill.id} value={bill.id.toString()}>
                      {bill.name} (Total: ${bill.total})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              If this expense is a payment towards a debt/bill (like a credit
              card), select it here to update the remaining balance.
            </p>
          </div>
          <Button onClick={handleAddExpense} className="w-full">
            Add Expense
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
