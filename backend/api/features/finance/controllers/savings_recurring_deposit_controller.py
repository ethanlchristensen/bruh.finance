from typing import List

from ninja_extra import api_controller, route
from ninja_jwt.authentication import JWTAuth

from api.features.finance.models import SavingsRecurringDeposit
from api.features.finance.schemas import SavingsRecurringDepositSchema
from api.features.finance.utils import get_or_create_savings_account
from api.features.users.permissons import IsApproved


@api_controller(
    "/finance/savings/recurring-deposits",
    auth=JWTAuth(),
    tags=["Savings Recurring Deposits"],
    permissions=[IsApproved],
)
class SavingsRecurringDepositController:
    @route.get("", response=List[SavingsRecurringDepositSchema])
    def list_recurring_deposits(self, request):
        """List all recurring savings deposits for the current user"""
        return SavingsRecurringDeposit.objects.filter(user=request.user, is_deleted=False)

    @route.get("/{deposit_id}", response=SavingsRecurringDepositSchema)
    def get_recurring_deposit(self, request, deposit_id: int):
        """Retrieve a specific recurring savings deposit"""
        return SavingsRecurringDeposit.objects.get(
            id=deposit_id, user=request.user, is_deleted=False
        )

    @route.post("", response={201: SavingsRecurringDepositSchema, 400: dict})
    def create_recurring_deposit(self, request, data: SavingsRecurringDepositSchema):
        """Create a new recurring savings deposit"""
        savings_account = get_or_create_savings_account(request.user)
        payload = data.dict(exclude_unset=True, by_alias=True, exclude={"id"})

        frequency = payload.get("frequency", "monthly").lower()
        day_of_week = payload.get("day_of_week")
        day_of_month = payload.get("day_of_month")
        start_date = payload.get("start_date")

        if frequency in {"weekly", "biweekly"} and day_of_week is None:
            if start_date:
                payload["day_of_week"] = start_date.weekday()
            else:
                return 400, {"error": "day_of_week is required for weekly or biweekly frequency."}

        if frequency == "monthly" and day_of_month is None:
            if start_date:
                payload["day_of_month"] = start_date.day
            else:
                return 400, {"error": "day_of_month is required for monthly frequency."}

        recurring_deposit = SavingsRecurringDeposit.objects.create(
            user=request.user,
            savings_account=savings_account,
            **payload,
        )
        return 201, recurring_deposit

    @route.patch("/{deposit_id}", response=SavingsRecurringDepositSchema)
    def update_recurring_deposit(
        self, request, deposit_id: int, data: SavingsRecurringDepositSchema
    ):
        """Update an existing recurring savings deposit"""
        recurring_deposit = SavingsRecurringDeposit.objects.get(
            id=deposit_id, user=request.user, is_deleted=False
        )
        payload = data.dict(exclude_unset=True, by_alias=True, exclude={"id"})

        for attr, value in payload.items():
            setattr(recurring_deposit, attr, value)
        recurring_deposit.save()
        return recurring_deposit

    @route.delete("/{deposit_id}", response={204: None})
    def delete_recurring_deposit(self, request, deposit_id: int):
        """Soft delete a recurring savings deposit"""
        recurring_deposit = SavingsRecurringDeposit.objects.get(
            id=deposit_id, user=request.user, is_deleted=False
        )
        recurring_deposit.soft_delete()
        return 204, None
