import { useState, useEffect } from "react";
import type { RecurringBill, Category } from "@/lib/finance-api";
import { getCategories } from "@/lib/finance-api";
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
import { useUpdateRecurringBill } from "@/hooks/use-recurring-bills";
import { Loader2 } from "lucide-react";

interface BillEditDialogProps {
  bill: RecurringBill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updated: Partial<RecurringBill>) => void;
}

export function BillEditDialog({
  bill,
  open,
  onOpenChange,
  onSave,
}: BillEditDialogProps) {
  const [formData, setFormData] = useState<Partial<RecurringBill>>({});
  const [prevBill, setPrevBill] = useState<RecurringBill | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const {
    mutate: updateBill,
    isPending,
    isSuccess,
    reset,
  } = useUpdateRecurringBill();

  useEffect(() => {
    async function loadCategories() {
      try {
        console.log("BillEditDialog: Fetching categories...");
        const fetched = await getCategories();
        console.log("BillEditDialog: Fetched categories:", fetched);
        setCategories(fetched);
      } catch (error) {
        console.error("BillEditDialog: Failed to load categories:", error);
      }
    }
    loadCategories();
  }, []);

  if (bill !== prevBill) {
    setPrevBill(bill);
    if (bill) {
      console.log("BillEditDialog: Bill selected:", bill);
      setFormData({
        ...bill,
        category_id: bill.category?.id || bill.category_id || undefined,
      });
    } else {
      setFormData({});
    }
  }

  useEffect(() => {
    if (isSuccess) {
      onOpenChange(false);
      reset();
    }
  }, [isSuccess, onOpenChange, reset]);

  const handleSave = () => {
    if (bill && formData.id) {
      // Create update payload without the category object to avoid issues with nested schema
      const { category, ...payload } = formData;
      onSave(payload);
      updateBill({ id: bill.id, bill: payload });
    }
  };

  if (!bill) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-120"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edit Bill</DialogTitle>
          <DialogDescription>
            Update the details for this recurring bill.
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
              <Label htmlFor="dueDay">Due Day</Label>
              <Input
                id="dueDay"
                type="number"
                min="1"
                max="31"
                value={formData.dueDay ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dueDay: parseInt(e.target.value) || 1,
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
                console.log("BillEditDialog: Category changed to:", v);
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
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="total">Total ($)</Label>
              <Input
                id="total"
                type="number"
                step="0.01"
                value={formData.total ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    total: parseFloat(e.target.value) || null,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amountPaid">Amount Paid ($)</Label>
              <Input
                id="amountPaid"
                type="number"
                step="0.01"
                value={formData.amountPaid ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amountPaid: parseFloat(e.target.value) || null,
                  })
                }
              />
            </div>
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
