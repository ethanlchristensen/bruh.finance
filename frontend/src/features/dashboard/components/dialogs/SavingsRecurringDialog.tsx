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
import { Repeat } from "lucide-react";
import { useSavingsRecurringDialog } from "./hooks/savings-recurring-dialog/useSavingsRecurringDialog";

interface SavingsRecurringDialogProps {
  onSuccess: () => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SavingsRecurringDialog({
  onSuccess,
  open,
  onOpenChange,
}: SavingsRecurringDialogProps) {
  const { savingsRecurringForm, setSavingsRecurringForm, handleAddSavingsRecurringDeposit } = useSavingsRecurringDialog(
    onSuccess,
    onOpenChange
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Repeat className="h-4 w-4 mr-2" />
          Recurring Savings
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Recurring Contribution</DialogTitle>
          <DialogDescription>
            Plan automatic contributions to your savings account.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="recurringSavingsName">Name</Label>
            <Input
              id="recurringSavingsName"
              placeholder="Monthly transfer"
              value={savingsRecurringForm.name}
              onChange={(e) =>
                setSavingsRecurringForm({
                  ...savingsRecurringForm,
                  name: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="recurringSavingsAmount">Amount</Label>
            <Input
              id="recurringSavingsAmount"
              type="number"
              step="0.01"
              placeholder="200.00"
              value={savingsRecurringForm.amount}
              onChange={(e) =>
                setSavingsRecurringForm({
                  ...savingsRecurringForm,
                  amount: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="recurringSavingsFrequency">Frequency</Label>
            <Select
              value={savingsRecurringForm.frequency}
              onValueChange={(v) =>
                setSavingsRecurringForm({
                  ...savingsRecurringForm,
                  frequency: v,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="recurringSavingsStart">Start Date</Label>
            <Input
              id="recurringSavingsStart"
              type="date"
              value={savingsRecurringForm.startDate}
              onChange={(e) =>
                setSavingsRecurringForm({
                  ...savingsRecurringForm,
                  startDate: e.target.value,
                })
              }
            />
          </div>
          {(["weekly", "biweekly"].includes(
            savingsRecurringForm.frequency,
          ) && (
            <div>
              <Label htmlFor="recurringSavingsDayOfWeek">
                Day of Week
              </Label>
              <Select
                value={savingsRecurringForm.dayOfWeek}
                onValueChange={(v) =>
                  setSavingsRecurringForm({
                    ...savingsRecurringForm,
                    dayOfWeek: v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )) ||
            (savingsRecurringForm.frequency === "monthly" && (
              <div>
                <Label htmlFor="recurringSavingsDayOfMonth">
                  Day of Month
                </Label>
                <Input
                  id="recurringSavingsDayOfMonth"
                  type="number"
                  min="1"
                  max="31"
                  value={savingsRecurringForm.dayOfMonth}
                  onChange={(e) =>
                    setSavingsRecurringForm({
                      ...savingsRecurringForm,
                      dayOfMonth: e.target.value,
                    })
                  }
                />
              </div>
            ))}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="recurringSavingsPayroll"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={savingsRecurringForm.isPayrollDeposit}
              onChange={(e) =>
                setSavingsRecurringForm({
                  ...savingsRecurringForm,
                  isPayrollDeposit: e.target.checked,
                })
              }
            />
            <Label
              htmlFor="recurringSavingsPayroll"
              className="font-normal"
            >
              Deduct directly from payroll? (Skip checking account)
            </Label>
          </div>
          <div>
            <Label htmlFor="recurringSavingsNotes">
              Notes (Optional)
            </Label>
            <Input
              id="recurringSavingsNotes"
              placeholder="Automatic transfer from paycheck"
              value={savingsRecurringForm.notes}
              onChange={(e) =>
                setSavingsRecurringForm({
                  ...savingsRecurringForm,
                  notes: e.target.value,
                })
              }
            />
          </div>
          <Button
            onClick={handleAddSavingsRecurringDeposit}
            className="w-full"
          >
            Add Recurring Contribution
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
