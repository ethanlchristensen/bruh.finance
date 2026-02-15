from decimal import Decimal

from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from .models import FinanceAccount


@receiver(post_save, sender=User)
def create_finance_account(sender, instance, created, **kwargs):
    if created:
        FinanceAccount.objects.create(
            user=instance,
            starting_balance=Decimal("0.00"),
            current_balance=Decimal("0.00"),
            balance_as_of_date=timezone.now().date(),
        )


@receiver(post_save, sender=User)
def save_finance_account(sender, instance, **kwargs):
    if hasattr(instance, "finance_account"):
        instance.finance_account.save()
