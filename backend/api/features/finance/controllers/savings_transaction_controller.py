from decimal import Decimal
from typing import List

from ninja_extra import api_controller, route
from ninja_jwt.authentication import JWTAuth

from api.features.finance.models import SavingsTransaction
from api.features.finance.schemas import SavingsTransactionSchema
from api.features.finance.utils import (
    get_or_create_finance_account,
    get_or_create_savings_account,
)


@api_controller("/finance/savings/transactions", auth=JWTAuth(), tags=["Savings Transactions"])
class SavingsTransactionController:
    @route.get("", response=List[SavingsTransactionSchema])
    def list_transactions(self, request):
        """List all savings transactions for the current user"""
        return SavingsTransaction.objects.filter(user=request.user, is_deleted=False).order_by(
            "-date", "-created_at"
        )

    @route.get("/{transaction_id}", response=SavingsTransactionSchema)
    def get_transaction(self, request, transaction_id: int):
        """Retrieve a specific savings transaction"""
        return SavingsTransaction.objects.get(
            id=transaction_id, user=request.user, is_deleted=False
        )

    @route.post("", response={201: SavingsTransactionSchema, 400: dict})
    def create_transaction(self, request, data: SavingsTransactionSchema):
        """Create a new savings transaction"""
        savings_account = get_or_create_savings_account(request.user)
        finance_account = get_or_create_finance_account(request.user)

        payload = data.dict(exclude_unset=True, by_alias=True, exclude={"id"})
        transaction_type = payload.get("transaction_type")
        amount_value = payload.get("amount")

        if amount_value is None:
            return 400, {"error": "Amount is required."}

        amount = Decimal(str(amount_value))
        if amount <= 0:
            return 400, {"error": "Amount must be greater than zero."}

        transaction_date = payload.get("date")

        if transaction_type == "deposit":
            if (finance_account.current_balance or Decimal("0")) < amount:
                return 400, {"error": "Insufficient checking balance for deposit."}
            savings_account.current_balance = (
                savings_account.current_balance or Decimal("0")
            ) + amount
            finance_account.current_balance = (
                finance_account.current_balance or Decimal("0")
            ) - amount
        elif transaction_type == "transfer_to_checking":
            if (savings_account.current_balance or Decimal("0")) < amount:
                return 400, {"error": "Insufficient savings balance for transfer."}
            savings_account.current_balance -= amount
            finance_account.current_balance = (
                finance_account.current_balance or Decimal("0")
            ) + amount
        else:
            return 400, {"error": f"Unsupported transaction type: {transaction_type}"}

        if transaction_date:
            if (
                not savings_account.balance_as_of_date
                or transaction_date >= savings_account.balance_as_of_date
            ):
                savings_account.balance_as_of_date = transaction_date
            if (
                not finance_account.balance_as_of_date
                or transaction_date >= finance_account.balance_as_of_date
            ):
                finance_account.balance_as_of_date = transaction_date

        savings_account.save()
        finance_account.save()

        transaction = SavingsTransaction.objects.create(
            user=request.user,
            savings_account=savings_account,
            **payload,
        )
        return 201, transaction

    @route.delete("/{transaction_id}", response={204: None})
    def delete_transaction(self, request, transaction_id: int):
        """Soft delete a savings transaction and revert its balance impact"""
        transaction = SavingsTransaction.objects.get(
            id=transaction_id, user=request.user, is_deleted=False
        )
        savings_account = get_or_create_savings_account(request.user)
        finance_account = get_or_create_finance_account(request.user)

        amount = transaction.amount
        if transaction.transaction_type == "deposit":
            savings_account.current_balance = (
                savings_account.current_balance or Decimal("0")
            ) - amount
            finance_account.current_balance = (
                finance_account.current_balance or Decimal("0")
            ) + amount
        elif transaction.transaction_type == "transfer_to_checking":
            savings_account.current_balance = (
                savings_account.current_balance or Decimal("0")
            ) + amount
            finance_account.current_balance = (
                finance_account.current_balance or Decimal("0")
            ) - amount

        savings_account.save()
        finance_account.save()
        transaction.soft_delete()
        return 204, None
