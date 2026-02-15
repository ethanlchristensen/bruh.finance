from typing import List

from ninja_extra import api_controller, route
from ninja_jwt.authentication import JWTAuth

from api.features.finance.models import Category, FinanceAccount, Paycheck
from api.features.finance.schemas import PaycheckSchema


@api_controller("/finance/paychecks", auth=JWTAuth(), tags=["Paychecks"])
class PaycheckController:
    @route.get("", response=List[PaycheckSchema])
    def list_paychecks(self, request):
        """List all paychecks for current user"""
        return Paycheck.objects.filter(user=request.user, is_deleted=False).select_related(
            "category"
        )

    @route.get("/{paycheck_id}", response=PaycheckSchema)
    def get_paycheck(self, request, paycheck_id: int):
        """Get a specific paycheck"""
        return Paycheck.objects.select_related("category").get(
            id=paycheck_id, user=request.user, is_deleted=False
        )

    @route.post("", response={201: PaycheckSchema, 400: dict})
    def create_paycheck(self, request, data: PaycheckSchema):
        """Create a new paycheck"""
        finance_account = FinanceAccount.objects.get(user=request.user)
        payload = data.dict(exclude_unset=True, by_alias=True, exclude={"id", "category"})

        category_id = data.category_id
        if category_id:
            category = Category.objects.get(id=category_id, user=request.user)
            payload["category"] = category

        paycheck = Paycheck.objects.create(
            user=request.user, finance_account=finance_account, **payload
        )
        return 201, paycheck

    @route.patch("/{paycheck_id}", response=PaycheckSchema)
    def update_paycheck(self, request, paycheck_id: int, data: PaycheckSchema):
        """Update a paycheck"""
        paycheck = Paycheck.objects.get(id=paycheck_id, user=request.user)
        payload = data.dict(exclude_unset=True, by_alias=True, exclude={"id", "category"})

        category_id = data.category_id
        if category_id:
            category = Category.objects.get(id=category_id, user=request.user)
            paycheck.category = category

        for attr, value in payload.items():
            setattr(paycheck, attr, value)
        paycheck.save()
        return paycheck

    @route.delete("/{paycheck_id}", response={204: None})
    def delete_paycheck(self, request, paycheck_id: int):
        """Soft delete a paycheck"""
        paycheck = Paycheck.objects.get(id=paycheck_id, user=request.user)
        paycheck.soft_delete()
        return 204, None
