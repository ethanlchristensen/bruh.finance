import type { Expense } from "@/lib/finance-api";
import { CreditCard, DollarSign, Calendar } from "lucide-react";
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

interface ExpensesSummaryProps {
  expenses: Expense[];
}

export function ExpensesSummary({ expenses }: ExpensesSummaryProps) {
  const now = new Date();
  const startOfThisMonth = startOfMonth(now);
  const endOfThisMonth = endOfMonth(now);

  const thisMonthExpenses = expenses.filter((e) =>
    isWithinInterval(new Date(e.date), {
      start: startOfThisMonth,
      end: endOfThisMonth,
    }),
  );

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const thisMonthAmount = thisMonthExpenses.reduce(
    (sum, e) => sum + e.amount,
    0,
  );

  const stats = [
    {
      label: "Total Expenses",
      value: `$${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
    },
    {
      label: "This Month",
      value: `$${thisMonthAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: CreditCard,
    },
    {
      label: "Month Count",
      value: thisMonthExpenses.length.toString(),
      icon: Calendar,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-4 rounded-lg border bg-card p-4"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <stat.icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-xl font-semibold tracking-tight font-mono">
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
