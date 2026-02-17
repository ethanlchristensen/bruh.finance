import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface HeaderProps {
  monthsToShow: number;
  setMonthsToShow: (months: number) => void;
}

export function Header({ monthsToShow, setMonthsToShow }: HeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Finance Calendar</h1>
        <p className="text-muted-foreground">
          Track your income, bills, and expenses
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="months-select" className="text-sm font-medium">
          Show:
        </Label>
        <Select
          value={monthsToShow.toString()}
          onValueChange={(v) => setMonthsToShow(Number.parseInt(v))}
        >
          <SelectTrigger id="months-select" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 Month</SelectItem>
            <SelectItem value="2">2 Months</SelectItem>
            <SelectItem value="3">3 Months</SelectItem>
            <SelectItem value="4">4 Months</SelectItem>
            <SelectItem value="5">5 Months</SelectItem>
            <SelectItem value="6">6 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
