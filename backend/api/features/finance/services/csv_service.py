import csv
import io
from typing import List
from decimal import Decimal, InvalidOperation
from datetime import datetime, date
from django.contrib.auth.models import User
from ninja.files import UploadedFile
from api.features.finance.models import RecurringBill
from api.features.finance.services.calendar_service import CalendarService


class CSVService:
    def __init__(self):
        self.calendar_service = CalendarService()

    def import_bills_from_csv(self, file: UploadedFile, user: User) -> List[RecurringBill]:
        """Import bills from CSV file"""
        
        # Read CSV file
        content = file.read().decode('utf-8')
        csv_reader = csv.reader(io.StringIO(content))
        
        # Skip header
        next(csv_reader, None)
        
        imported_bills = []
        
        for row in csv_reader:
            if len(row) < 3:
                continue
                
            description = row[0].strip()
            due_date = row[1].strip()
            monthly_cost = row[2].strip()
            remaining = row[3].strip() if len(row) > 3 else ""
            
            if not description or not due_date or not monthly_cost:
                continue
            
            # Parse due day
            try:
                if '/' in due_date:
                    parts = due_date.split('/')
                    due_day = int(parts[1] if len(parts) > 1 else parts[0])
                else:
                    due_day = int(due_date)
                
                if due_day < 1 or due_day > 31:
                    continue
            except ValueError:
                continue
            
            # Parse amount
            try:
                amount = Decimal(monthly_cost)
            except (ValueError, InvalidOperation):
                continue
            
            # Create bill object
            bill_data = {
                'user': user,
                'name': description,
                'amount': amount,
                'due_day': due_day,
                'category': 'Other',
                'color': 'bg-gray-500'
            }
            
            # Add total if remaining amount exists
            if remaining:
                try:
                    total_remaining = Decimal(remaining)
                    if total_remaining > 0:
                        bill_data['total'] = total_remaining
                        bill_data['amount_paid'] = Decimal('0.00')
                except (ValueError, InvalidOperation):
                    pass
            
            # Save bill
            bill = RecurringBill.objects.create(**bill_data)
            imported_bills.append(bill)
        
        return imported_bills

    def generate_export_csv(
        self,
        user: User,
        start_date: date,
        end_date: date,
        months_to_show: int
    ) -> str:
        """Generate CSV export of finance data"""
        
        # Get calendar data
        calendar_data = self.calendar_service.generate_calendar_data(
            user=user,
            start_date=start_date,
            end_date=end_date,
            months_to_show=months_to_show
        )
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write summary section
        writer.writerow(['MONTHLY SUMMARY'])
        writer.writerow(['Month', 'Income', 'Bills', 'Expenses', 'Net Change', 'End Balance'])
        
        # Calculate monthly summaries
        monthly_summaries = self._calculate_monthly_summaries(calendar_data)
        for summary in monthly_summaries:
            writer.writerow([
                summary['month'],
                f"{summary['income']:.2f}",
                f"{summary['bills']:.2f}",
                f"{summary['expenses']:.2f}",
                f"{summary['net']:.2f}",
                f"{summary['end_balance']:.2f}"
            ])
        
        # Empty row
        writer.writerow([])
        
        # Write daily breakdown
        writer.writerow(['DAILY BREAKDOWN'])
        writer.writerow(['Date', 'Day of Week', 'Income', 'Bills', 'Expenses', 'Net Change', 'Balance', 'Details'])
        
        for day in calendar_data:
            day_date = datetime.fromisoformat(day['date'])
            day_of_week = day_date.strftime('%a')
            
            total_income = sum(Decimal(str(pc['amount'])) for pc in day['paychecks'])
            total_bills = sum(Decimal(str(bill['amount'])) for bill in day['bills'])
            total_expenses = sum(Decimal(str(exp['amount'])) for exp in day['expenses'])
            net_change = total_income - total_bills - total_expenses
            
            # Create details string
            details = []
            for pc in day['paychecks']:
                details.append(f"+${pc['amount']:.2f} (Paycheck)")
            for bill in day['bills']:
                details.append(f"-${bill['amount']:.2f} ({bill['name']})")
            for exp in day['expenses']:
                details.append(f"-${exp['amount']:.2f} ({exp['name']})")
            
            writer.writerow([
                day['date'],
                day_of_week,
                f"{total_income:.2f}",
                f"{total_bills:.2f}",
                f"{total_expenses:.2f}",
                f"{net_change:.2f}",
                f"{day['runningBalance']:.2f}",
                '; '.join(details)
            ])
        
        return output.getvalue()

    def _calculate_monthly_summaries(self, calendar_data: List[dict]) -> List[dict]:
        """Calculate monthly summaries from calendar data"""
        monthly_data = {}
        
        for day in calendar_data:
            day_date = datetime.fromisoformat(day['date'])
            month_key = f"{day_date.year}-{day_date.month:02d}"
            
            if month_key not in monthly_data:
                monthly_data[month_key] = {
                    'month': day_date.strftime('%B %Y'),
                    'income': Decimal('0.00'),
                    'bills': Decimal('0.00'),
                    'expenses': Decimal('0.00'),
                    'end_balance': Decimal('0.00')
                }
            
            monthly_data[month_key]['income'] += sum(Decimal(str(pc['amount'])) for pc in day['paychecks'])
            monthly_data[month_key]['bills'] += sum(Decimal(str(bill['amount'])) for bill in day['bills'])
            monthly_data[month_key]['expenses'] += sum(Decimal(str(exp['amount'])) for exp in day['expenses'])
            monthly_data[month_key]['end_balance'] = day['runningBalance']
        
        # Calculate net for each month
        for month_key in monthly_data:
            data = monthly_data[month_key]
            data['net'] = data['income'] - data['bills'] - data['expenses']
        
        return list(monthly_data.values())