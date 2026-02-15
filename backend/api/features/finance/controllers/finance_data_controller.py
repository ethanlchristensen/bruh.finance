from ninja_extra import api_controller, route
from ninja_jwt.authentication import JWTAuth

from api.features.finance.models import Expense, Paycheck, RecurringBill
from api.features.finance.schemas import FinanceDataSchema
from api.features.finance.utils import get_or_create_finance_account


@api_controller("/finance", auth=JWTAuth(), tags=["Finance Data"])
class FinanceDataController:
    @route.get("", response=FinanceDataSchema)
    def get_all_finance_data(self, request):
        """Get all finance data for current user"""
        account = get_or_create_finance_account(user=request.user)
        recurring_bills = RecurringBill.objects.filter(user=request.user, is_deleted=False)
        paychecks = Paycheck.objects.filter(user=request.user, is_deleted=False)
        expenses = Expense.objects.filter(user=request.user, is_deleted=False)

        return {
            "account": account,
            "recurringBills": recurring_bills,
            "paychecks": paychecks,
            "expenses": expenses,
        }
