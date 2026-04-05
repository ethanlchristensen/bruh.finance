import { useState, useEffect } from "react";
import type { Expense, Category, RecurringBill } from "@/lib/finance-api";
import { getCategories, getRecurringBills } from "@/lib/finance-api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateExpense } from "@/hooks/use-expenses";
import { Loader2 } from "lucide-react";

interface ExpenseEditDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updated: Partial<Expense>) => void;
}

export function ExpenseEditDialog({
  expense,
  open,
  onOpenChange,
  onSave,
}: ExpenseEditDialogProps) {
  const [formData, setFormData] = useState<Partial<Expense>>({});
  const [lastExpenseId, setLastExpenseId] = useState<number | undefined>();

  if (expense && expense.id !== lastExpenseId) {
    setLastExpenseId(expense.id);
    setFormData({
      ...expense,
      category_id: expense.category?.id || expense.category_id || undefined,
      relatedBillId: expense.relatedBillId || undefined,
    });
  }

  const [categories, setCategories] = useState<Category[]>([]);
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const {
    mutate: updateExpense,
    isPending,
    isSuccess,
    reset,
  } = useUpdateExpense();

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedCategories, fetchedBills] = await Promise.all([
          getCategories(),
          getRecurringBills(),
        ]);
        setCategories(fetchedCategories);
        setRecurringBills(fetchedBills);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (isSuccess) {
      onOpenChange(false);
      reset();
    }
  }, [isSuccess, onOpenChange, reset]);

  const handleSave = () => {
    if (expense && formData.id) {
      const { category, ...payload } = formData;
      // Handle the "none" case for relatedBillId
      if (
        payload.relatedBillId === null ||
        (payload.relatedBillId as any) === "none"
      ) {
        payload.relatedBillId = null;
      }
      onSave(payload);
      updateExpense({ id: expense.id, expense: payload });
    }
  };

  if (!expense) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-120"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
          <DialogDescription>
            Update the details for this expense.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date ? formData.date.split("T")[0] : ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    date: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category_id?.toString() || ""}
              onValueChange={(v) => {
                setFormData({ ...formData, category_id: parseInt(v) });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.length === 0 && (
                  <SelectItem value="none" disabled>
                    No categories available
                  </SelectItem>
                )}
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="relatedBill">Apply Towards Bill (Optional)</Label>
            <Select
              value={formData.relatedBillId?.toString() || "none"}
              onValueChange={(v) =>
                setFormData({
                  ...formData,
                  relatedBillId: v === "none" ? null : parseInt(v),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {recurringBills
                  .filter((bill) => bill.total)
                  .map((bill) => (
                    <SelectItem key={bill.id} value={bill.id.toString()}>
                      {bill.name} (Total: ${bill.total})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
