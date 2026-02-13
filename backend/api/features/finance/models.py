from django.db import models
from django.contrib.auth.models import User


class FinanceAccount(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="finance_account")
    starting_balance = models.DecimalField(max_digits=10, decimal_places=2)
    current_balance = models.DecimalField(max_digits=10, decimal_places=2)
    balance_as_of_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}'s Finance Account"


class RecurringBill(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="recurring_bills")
    name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_day = models.IntegerField()
    category = models.CharField(max_length=255)
    color = models.CharField(max_length=7)  # Assuming hex color code
    total = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username}'s {self.name}"


class Paycheck(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="paychecks")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    frequency = models.CharField(max_length=255)  # "weekly", "biweekly", etc.
    day_of_week = models.IntegerField(null=True, blank=True)  # 0-6 for weekly
    day_of_month = models.IntegerField(null=True, blank=True)  # 1-31 for monthly

    def __str__(self):
        return f"{self.user.username}'s Paycheck on {self.date}"


class Expense(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="expenses")
    name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    category = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.user.username}'s {self.name} on {self.date}"
