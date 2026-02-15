from datetime import date, timedelta
from decimal import Decimal
from typing import Any, Dict, List

from django.contrib.auth.models import User

from api.features.finance.models import Expense, FinanceAccount, Paycheck, RecurringBill


class FinanceDashboardService:
    def get_complete_finance_data(self, user: User) -> Dict[str, Any]:
        """Get all finance data for a user"""
        try:
            account = FinanceAccount.objects.get(user=user)
        except FinanceAccount.DoesNotExist:
            raise ValueError("No finance account found for user")

        expenses = Expense.objects.filter(user=user, is_deleted=False).order_by("date")
        paychecks = Paycheck.objects.filter(user=user, is_deleted=False).order_by("date")
        bills = RecurringBill.objects.filter(user=user, is_deleted=False).order_by("due_day")

        return {
            "account": {
                "startingBalance": account.starting_balance,
                "currentBalance": account.current_balance,
                "balanceAsOfDate": account.balance_as_of_date.isoformat(),
            },
            "expenses": [
                {
                    "id": exp.id,
                    "name": exp.name,
                    "amount": exp.amount,
                    "date": exp.date.isoformat(),
                    "category": exp.category,
                }
                for exp in expenses
            ],
            "paychecks": [
                {
                    "id": pc.id,
                    "amount": pc.amount,
                    "date": pc.date.isoformat(),
                    "frequency": pc.frequency,
                }
                for pc in paychecks
            ],
            "recurringBills": [
                {
                    "id": bill.id,
                    "name": bill.name,
                    "amount": bill.amount,
                    "dueDay": bill.due_day,
                    "category": bill.category,
                    "color": bill.color,
                    "total": bill.total,
                    "amountPaid": bill.amount_paid or Decimal("0.00"),
                }
                for bill in bills
            ],
        }

    def get_monthly_summary(
        self, user: User, start_date: date, months_count: int
    ) -> List[Dict[str, Any]]:
        """Generate monthly summary data"""
        start = start_date
        summaries = []

        for i in range(months_count):
            # Calculate month boundaries
            month_start = (
                date(start.year, start.month + i, 1)
                if start.month + i <= 12
                else date(
                    start.year + (start.month + i - 1) // 12, ((start.month + i - 1) % 12) + 1, 1
                )
            )

            # Get last day of month
            if month_start.month == 12:
                month_end = date(month_start.year + 1, 1, 1) - timedelta(days=1)
            else:
                month_end = date(month_start.year, month_start.month + 1, 1) - timedelta(days=1)

            # Get data for this month
            month_income = self._calculate_monthly_income(user, month_start, month_end)
            month_bills = self._calculate_monthly_bills(user, month_start, month_end)
            month_expenses = self._calculate_monthly_expenses(user, month_start, month_end)

            summaries.append(
                {
                    "month": month_start.strftime("%B %Y"),
                    "income": month_income,
                    "bills": month_bills,
                    "expenses": month_expenses,
                    "net": month_income - month_bills - month_expenses,
                }
            )

        return summaries

    def _calculate_monthly_income(self, user: User, start_date: date, end_date: date) -> Decimal:
        """Calculate total income for a date range"""
        paychecks = Paycheck.objects.filter(
            user=user, date__gte=start_date, date__lte=end_date, is_deleted=False
        )
        return sum(pc.amount for pc in paychecks) or Decimal("0.00")

    def _calculate_monthly_bills(self, user: User, start_date: date, end_date: date) -> Decimal:
        """Calculate total bills for a date range"""
        bills = RecurringBill.objects.filter(user=user, is_deleted=False)
        total = Decimal("0.00")

        # Calculate how many times each bill occurs in the date range
        current_date = start_date
        while current_date <= end_date:
            for bill in bills:
                if bill.due_day == current_date.day:
                    # Check if bill is paid off
                    if bill.total:
                        if (bill.amount_paid or Decimal("0.00")) < bill.total:
                            total += bill.amount
                    else:
                        total += bill.amount
            current_date += timedelta(days=1)

        return total

    def _calculate_monthly_expenses(self, user: User, start_date: date, end_date: date) -> Decimal:
        """Calculate total expenses for a date range"""
        expenses = Expense.objects.filter(
            user=user, date__gte=start_date, date__lte=end_date, is_deleted=False
        )
        return sum(exp.amount for exp in expenses) or Decimal("0.00")
