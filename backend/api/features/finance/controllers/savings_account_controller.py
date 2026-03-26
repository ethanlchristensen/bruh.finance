from ninja_extra import api_controller, route
from ninja_jwt.authentication import JWTAuth

from api.features.finance.schemas import SavingsAccountSchema
from api.features.finance.utils import get_or_create_savings_account
from api.features.users.permissons import IsApproved


@api_controller(
    "/finance/savings/account", auth=JWTAuth(), tags=["Savings Account"], permissions=[IsApproved]
)
class SavingsAccountController:
    @route.get("", response=SavingsAccountSchema)
    def get_account(self, request):
        """Get the current user's savings account"""
        return get_or_create_savings_account(request.user)

    @route.patch("", response=SavingsAccountSchema)
    def update_account(self, request, data: SavingsAccountSchema):
        """Update the current user's savings account"""
        account = get_or_create_savings_account(request.user)
        for attr, value in data.dict(exclude_unset=True, by_alias=True).items():
            if attr == "created_at":
                continue
            setattr(account, attr, value)
        account.save()
        return account
