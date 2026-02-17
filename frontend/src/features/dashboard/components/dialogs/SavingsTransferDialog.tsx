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
import { ArrowRightLeft } from "lucide-react";
import { useSavingsTransferDialog } from "./hooks/savings-transfer-dialog/useSavingsTransferDialog";

interface SavingsTransferDialogProps {
  onSuccess: () => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SavingsTransferDialog({
  onSuccess,
  open,
  onOpenChange,
}: SavingsTransferDialogProps) {
  const { savingsTransferForm, setSavingsTransferForm, handleTransferToChecking } = useSavingsTransferDialog(
    onSuccess,
    onOpenChange
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          Transfer to Checking
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer from Savings</DialogTitle>
          <DialogDescription>
            Move money from savings into your checking account.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="savingsTransferAmount">Amount</Label>
            <Input
              id="savingsTransferAmount"
              type="number"
              step="0.01"
              placeholder="150.00"
              value={savingsTransferForm.amount}
              onChange={(e) =>
                setSavingsTransferForm({
                  ...savingsTransferForm,
                  amount: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="savingsTransferDate">Date</Label>
            <Input
              id="savingsTransferDate"
              type="date"
              value={savingsTransferForm.date}
              onChange={(e) =>
                setSavingsTransferForm({
                  ...savingsTransferForm,
                  date: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="savingsTransferNotes">
              Notes (Optional)
            </Label>
            <Input
              id="savingsTransferNotes"
              placeholder="Emergency fund transfer"
              value={savingsTransferForm.notes}
              onChange={(e) =>
                setSavingsTransferForm({
                  ...savingsTransferForm,
                  notes: e.target.value,
                })
              }
            />
          </div>
          <Button onClick={handleTransferToChecking} className="w-full">
            Transfer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
