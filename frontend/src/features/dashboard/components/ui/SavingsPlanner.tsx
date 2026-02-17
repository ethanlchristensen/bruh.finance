import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import type { 
  SavingsRecurringDeposit, 
  SavingsTransaction 
} from "@/lib/finance-api";

interface SavingsPlannerProps {
  recurringDeposits: SavingsRecurringDeposit[];
  transactions: SavingsTransaction[];
  onDeleteRecurring: (id: number) => Promise<void>;
  onDeleteTransaction: (id: number) => Promise<void>;
}

export function SavingsPlanner({
  recurringDeposits,
  transactions,
  onDeleteRecurring,
  onDeleteTransaction,
}: SavingsPlannerProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Savings Planner</CardTitle>
        <CardDescription>
          Track planned contributions and recent savings activity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              Recurring Contributions
            </h3>
            {recurringDeposits.length > 0 ? (
              <div className="space-y-2">
                {recurringDeposits.map((deposit) => (
                  <div
                    key={deposit.id}
                    className="flex items-start justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-foreground">
                        {deposit.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${deposit.amount.toFixed(2)} · {deposit.frequency}
                        {deposit.isPayrollDeposit && (
                          <span className="ml-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                            Payroll
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Starts{" "}
                        {new Date(deposit.startDate).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteRecurring(deposit.id)}
                      className="opacity-60 hover:opacity-100 transition-opacity"
                      aria-label="Delete recurring savings deposit"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No recurring contributions yet. Add one to automate your
                savings.
              </p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              Recent Savings Activity
            </h3>
            {transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions
                  .slice(0, 6)
                  .map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-start justify-between rounded-lg border p-3"
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-foreground">
                          {transaction.transactionType === "deposit"
                            ? "Deposit"
                            : "Transfer to Checking"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ${transaction.amount.toFixed(2)} ·{" "}
                          {new Date(transaction.date).toLocaleDateString()}
                        </div>
                        {transaction.notes && (
                          <div className="text-xs text-muted-foreground">
                            {transaction.notes}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => onDeleteTransaction(transaction.id)}
                        className="opacity-60 hover:opacity-100 transition-opacity"
                        aria-label="Delete savings transaction"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No savings transactions recorded yet.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
