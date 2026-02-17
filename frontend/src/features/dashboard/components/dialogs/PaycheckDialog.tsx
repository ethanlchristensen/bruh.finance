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
import { usePaycheckDialog } from "./hooks/paycheck-dialog/usePaycheckDialog";

interface PaycheckDialogProps {
  onSuccess: () => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaycheckDialog({
  onSuccess,
  open,
  onOpenChange,
}: PaycheckDialogProps) {
  const { paycheckForm, setPaycheckForm, handleAddPaycheck } =
    usePaycheckDialog(onSuccess, onOpenChange);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Paycheck
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Paycheck</DialogTitle>
          <DialogDescription>
            Add a paycheck and automatically propagate for a year
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="paycheckAmount">Amount</Label>
            <Input
              id="paycheckAmount"
              type="number"
              step="0.01"
              placeholder="2000.00"
              value={paycheckForm.amount}
              onChange={(e) =>
                setPaycheckForm({
                  ...paycheckForm,
                  amount: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="paycheckDate">Start Date</Label>
            <Input
              id="paycheckDate"
              type="date"
              value={paycheckForm.date}
              onChange={(e) =>
                setPaycheckForm({
                  ...paycheckForm,
                  date: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="paycheckFrequency">Frequency</Label>
            <Select
              value={paycheckForm.frequency}
              onValueChange={(v: any) =>
                setPaycheckForm({ ...paycheckForm, frequency: v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">
                  Bi-Weekly (Every 2 weeks)
                </SelectItem>
                <SelectItem value="bimonthly">
                  Bi-Monthly (Twice a month)
                </SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="custom">One-Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paycheckForm.frequency === "bimonthly" && (
            <div>
              <Label htmlFor="secondDay">Second Payday (Optional)</Label>
              <Input
                id="secondDay"
                type="number"
                min="1"
                max="31"
                placeholder="Leave blank to use +15 days"
                value={paycheckForm.secondDay}
                onChange={(e) =>
                  setPaycheckForm({
                    ...paycheckForm,
                    secondDay: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                First payday is set by the "Start Date". This sets the second
                payday of the month.
              </p>
            </div>
          )}

          <Button onClick={handleAddPaycheck} className="w-full">
            Add Paycheck
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
