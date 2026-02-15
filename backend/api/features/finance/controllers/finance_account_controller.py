from ninja_extra import api_controller, route
from ninja_jwt.authentication import JWTAuth

from api.features.finance.schemas import FinanceAccountSchema
from api.features.finance.utils import get_or_create_finance_account


@api_controller("/finance/account", auth=JWTAuth(), tags=["Finance Account"])
class FinanceAccountController:
    @route.get("", response=FinanceAccountSchema)
    def get_account(self, request):
        """Get current user's finance account"""
        return get_or_create_finance_account(request.user)

    @route.patch("", response=FinanceAccountSchema)
    def update_account(self, request, data: FinanceAccountSchema):
        """Update current user's finance account"""
        account = get_or_create_finance_account(request.user)
        # Use by_alias=True to get the database field names (snake_case)
        # exclude_unset=True ensures we only update fields that were actually sent
        for attr, value in data.dict(exclude_unset=True, by_alias=True).items():
            if attr == "created_at":  # Skip read-only field
                continue
            print(f"setting {attr} to {value} on finance account.")
            setattr(account, attr, value)
        account.save()
        return account
