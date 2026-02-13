from typing import List
from ninja_extra import api_controller, route
from ninja_jwt.authentication import JWTAuth
from api.features.finance.models import Paycheck, FinanceAccount
from api.features.finance.schemas import PaycheckSchema


@api_controller("/finance/paychecks", auth=JWTAuth(), tags=["Paychecks"])
class PaycheckController:
    @route.get("", response=List[PaycheckSchema])
    def list_paychecks(self, request):
        """List all paychecks for current user"""
        return Paycheck.objects.filter(user=request.user)

    @route.get("/{paycheck_id}", response=PaycheckSchema)
    def get_paycheck(self, request, paycheck_id: int):
        """Get a specific paycheck"""
        return Paycheck.objects.get(id=paycheck_id, user=request.user)

    @route.post("", response={201: PaycheckSchema, 400: dict})
    def create_paycheck(self, request, data: PaycheckSchema):
        """Create a new paycheck"""
        finance_account = FinanceAccount.objects.get(user=request.user)
        paycheck = Paycheck.objects.create(
            user=request.user,
            finance_account=finance_account,
            **data.dict(exclude_unset=True, exclude={"id"}, by_alias=True)
        )
        return 201, paycheck

    @route.patch("/{paycheck_id}", response=PaycheckSchema)
    def update_paycheck(self, request, paycheck_id: int, data: PaycheckSchema):
        """Update a paycheck"""
        paycheck = Paycheck.objects.get(id=paycheck_id, user=request.user)
        for attr, value in data.dict(exclude_unset=True, exclude={"id"}, by_alias=True).items():
            setattr(paycheck, attr, value)
        paycheck.save()
        return paycheck

    @route.delete("/{paycheck_id}", response={204: None})
    def delete_paycheck(self, request, paycheck_id: int):
        """Delete a paycheck"""
        paycheck = Paycheck.objects.get(id=paycheck_id, user=request.user)
        paycheck.delete()
        return 204, None
