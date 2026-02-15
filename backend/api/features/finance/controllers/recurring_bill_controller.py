from typing import List

from ninja_extra import api_controller, route
from ninja_jwt.authentication import JWTAuth

from api.features.finance.models import Category, FinanceAccount, RecurringBill
from api.features.finance.schemas import RecurringBillSchema


@api_controller("/finance/recurring-bills", auth=JWTAuth(), tags=["Recurring Bills"])
class RecurringBillController:
    @route.get("", response=List[RecurringBillSchema])
    def list_bills(self, request):
        """List all recurring bills for current user"""
        return RecurringBill.objects.filter(user=request.user).select_related("category")

    @route.get("/{bill_id}", response=RecurringBillSchema)
    def get_bill(self, request, bill_id: int):
        """Get a specific recurring bill"""
        return RecurringBill.objects.select_related("category").get(id=bill_id, user=request.user)

    @route.post("", response={201: RecurringBillSchema, 400: dict})
    def create_bill(self, request, data: RecurringBillSchema):
        """Create a new recurring bill"""
        finance_account = FinanceAccount.objects.get(user=request.user)
        payload = data.dict(exclude_unset=True, exclude={"id", "category"})

        category_id = data.category_id
        if category_id:
            category = Category.objects.get(id=category_id, user=request.user)
            payload["category"] = category

        bill = RecurringBill.objects.create(
            user=request.user, finance_account=finance_account, **payload
        )
        return 201, bill

    @route.patch("/{bill_id}", response=RecurringBillSchema)
    def update_bill(self, request, bill_id: int, data: RecurringBillSchema):
        """Update a recurring bill"""
        bill = RecurringBill.objects.get(id=bill_id, user=request.user)
        payload = data.dict(exclude_unset=True, exclude={"id", "category"})

        category_id = data.category_id
        if category_id:
            category = Category.objects.get(id=category_id, user=request.user)
            bill.category = category

        for attr, value in payload.items():
            setattr(bill, attr, value)

        bill.save()
        return bill

    @route.delete("/{bill_id}", response={204: None})
    def delete_bill(self, request, bill_id: int):
        """Delete a recurring bill"""
        bill = RecurringBill.objects.get(id=bill_id, user=request.user)
        bill.delete()
        return 204, None
