from decimal import Decimal

from django.utils import timezone

from .models import FinanceAccount


def get_or_create_finance_account(user):
    """
    Helper to get or create a FinanceAccount for a user.
    Ensures that the account always exists when needed.
    """
    account, created = FinanceAccount.objects.get_or_create(
        user=user,
        defaults={
            "starting_balance": Decimal("0.00"),
            "current_balance": Decimal("0.00"),
            "balance_as_of_date": timezone.now().date(),
        },
    )
    return account
