from ninja_extra import api_controller, route
from ninja_jwt.authentication import JWTAuth

from api.features.finance.models import (
    Expense,
    Paycheck,
    RecurringBill,
    SavingsRecurringDeposit,
    SavingsTransaction,
)
from api.features.finance.schemas import FinanceDataSchema
from api.features.finance.utils import get_or_create_finance_account, get_or_create_savings_account
from api.features.users.permissons import IsApproved


@api_controller("/finance", auth=JWTAuth(), tags=["Finance Data"], permissions=[IsApproved])
class FinanceDataController:
    @route.get("", response=FinanceDataSchema)
    def get_all_finance_data(self, request):
        """Get all finance data for current user"""
        account = get_or_create_finance_account(user=request.user)
        savings_account = get_or_create_savings_account(user=request.user)
        recurring_bills = RecurringBill.objects.filter(user=request.user, is_deleted=False)
        paychecks = Paycheck.objects.filter(user=request.user, is_deleted=False)
        expenses = Expense.objects.filter(user=request.user, is_deleted=False)
        recurring_savings = SavingsRecurringDeposit.objects.filter(
            user=request.user, is_deleted=False
        )
        savings_transactions = SavingsTransaction.objects.filter(
            user=request.user, is_deleted=False
        )

        return {
            "account": account,
            "recurringBills": recurring_bills,
            "paychecks": paychecks,
            "expenses": expenses,
            "savings_account": savings_account,
            "savings_recurring_deposits": recurring_savings,
            "savings_transactions": savings_transactions,
        }
