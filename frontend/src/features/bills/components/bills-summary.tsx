import type { RecurringBill } from "@/lib/finance-api";
import { CalendarDays, DollarSign, TrendingUp } from "lucide-react";

interface BillsSummaryProps {
  bills: RecurringBill[];
}

export function BillsSummary({ bills }: BillsSummaryProps) {
  const totalMonthly = bills.reduce((sum, b) => sum + b.amount, 0);
  const totalAnnual = totalMonthly * 12;
  const upcomingCount = bills.filter((b) => {
    const today = new Date().getDate();
    return b.dueDay >= today && b.dueDay <= today + 7;
  }).length;

  const stats = [
    {
      label: "Monthly Total",
      value: `$${totalMonthly.toFixed(2)}`,
      icon: DollarSign,
    },
    {
      label: "Annual Estimate",
      value: `$${totalAnnual.toFixed(2)}`,
      icon: TrendingUp,
    },
    {
      label: "Due This Week",
      value: upcomingCount.toString(),
      icon: CalendarDays,
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
