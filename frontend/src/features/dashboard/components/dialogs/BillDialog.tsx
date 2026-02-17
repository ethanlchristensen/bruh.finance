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
import { type Category } from "@/lib/finance-api";
import { useBillDialog } from "./hooks/bill-dialog/useBillDialog";

interface BillDialogProps {
  categories: Category[];
  onSuccess: () => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BillDialog({
  categories,
  onSuccess,
  open,
  onOpenChange,
}: BillDialogProps) {
  const { billForm, setBillForm, handleAddBill } = useBillDialog(
    categories,
    onSuccess,
    onOpenChange,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Bill
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Recurring Bill</DialogTitle>
          <DialogDescription>
            Add a bill that repeats every month
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="billName">Bill Name</Label>
            <Input
              id="billName"
              placeholder="Electric Bill"
              value={billForm.name}
              onChange={(e) =>
                setBillForm({ ...billForm, name: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="billAmount">Amount</Label>
            <Input
              id="billAmount"
              type="number"
              step="0.01"
              placeholder="150.00"
              value={billForm.amount}
              onChange={(e) =>
                setBillForm({ ...billForm, amount: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="dueDay">Due Day (1-31)</Label>
            <Input
              id="dueDay"
              type="number"
              min="1"
              max="31"
              placeholder="15"
              value={billForm.dueDay}
              onChange={(e) =>
                setBillForm({ ...billForm, dueDay: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="billTotal">Total Amount (Optional)</Label>
            <Input
              id="billTotal"
              type="number"
              step="0.01"
              placeholder="5000.00"
              value={billForm.total}
              onChange={(e) =>
                setBillForm({ ...billForm, total: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              For bills with a payoff amount (like loans). Leave blank for
              ongoing bills.
            </p>
          </div>
          <div>
            <Label htmlFor="billCategory">Category</Label>
            <Select
              value={billForm.category_id}
              onValueChange={(v) =>
                setBillForm({ ...billForm, category_id: v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter(
                    (cat) => cat.type === "bill" || cat.type === "general",
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
          <Button onClick={handleAddBill} className="w-full">
            Add Bill
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
