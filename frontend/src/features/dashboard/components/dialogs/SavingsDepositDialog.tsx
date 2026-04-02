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
import { PiggyBank } from "lucide-react";
import { useSavingsDepositDialog } from "./hooks/savings-deposit-dialog/useSavingsDepositDialog";

interface SavingsDepositDialogProps {
  onSuccess: () => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showTrigger?: boolean;
}

export function SavingsDepositDialog({
  onSuccess,
  open,
  onOpenChange,
  showTrigger = true,
}: SavingsDepositDialogProps) {
  const { savingsDepositForm, setSavingsDepositForm, handleAddSavingsDeposit } =
    useSavingsDepositDialog(onSuccess, onOpenChange);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <PiggyBank className="h-4 w-4 mr-2" />
            Savings Deposit
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Savings Deposit</DialogTitle>
          <DialogDescription>
            Record a one-time contribution to your savings account.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="savingsDepositAmount">Amount</Label>
            <Input
              id="savingsDepositAmount"
              type="number"
              step="0.01"
              placeholder="250.00"
              value={savingsDepositForm.amount}
              onChange={(e) =>
                setSavingsDepositForm({
                  ...savingsDepositForm,
                  amount: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="savingsDepositDate">Date</Label>
            <Input
              id="savingsDepositDate"
              type="date"
              value={savingsDepositForm.date}
              onChange={(e) =>
                setSavingsDepositForm({
                  ...savingsDepositForm,
                  date: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="savingsDepositNotes">Notes (Optional)</Label>
            <Input
              id="savingsDepositNotes"
              placeholder="July bonus deposit"
              value={savingsDepositForm.notes}
              onChange={(e) =>
                setSavingsDepositForm({
                  ...savingsDepositForm,
                  notes: e.target.value,
                })
              }
            />
          </div>
          <Button onClick={handleAddSavingsDeposit} className="w-full">
            Add Deposit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
