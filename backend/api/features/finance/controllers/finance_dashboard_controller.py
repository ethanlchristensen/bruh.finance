from typing import List, Dict, Any
from ninja_extra import api_controller, route
from ninja_jwt.authentication import JWTAuth
from ninja import File
from ninja.files import UploadedFile
from django.http import HttpResponse
from api.features.finance.services.finance_dashboard_service import FinanceDashboardService
from api.features.finance.services.calendar_service import CalendarService
from api.features.finance.services.csv_service import CSVService
from api.features.finance.schemas import (
    CalendarDataRequestSchema,
    CalendarDaySchema,
    MonthlySummaryRequestSchema,
    MonthlySummarySchema,
    ExportCSVRequestSchema,
    BalanceProjectionRequestSchema,
    FinanceDashboardDataSchema
)


@api_controller("/finance/dashboard", auth=JWTAuth(), tags=["Finance Dashboard"])
class FinanceDashboardController:
    def __init__(self):
        self.dashboard_service = FinanceDashboardService()
        self.calendar_service = CalendarService()
        self.csv_service = CSVService()

    @route.get("/data", response=FinanceDashboardDataSchema)
    def get_finance_data(self, request):
        """Get all finance data for the dashboard"""
        return self.dashboard_service.get_complete_finance_data(request.user)

    @route.post("/calendar", response=List[CalendarDaySchema])
    def generate_calendar_data(self, request, data: CalendarDataRequestSchema):
        """Generate calendar data with running balances"""
        calendar_data = self.calendar_service.generate_calendar_data(
            user=request.user,
            start_date=data.startDate,
            end_date=data.endDate,
            months_to_show=data.monthsToShow
        )
        return calendar_data

    @route.post("/summary", response=List[MonthlySummarySchema])
    def get_monthly_summary(self, request, data: MonthlySummaryRequestSchema):
        """Get summary data for specified months"""
        summary = self.dashboard_service.get_monthly_summary(
            user=request.user,
            start_date=data.startDate,
            months_count=data.monthsCount
        )
        return summary

    @route.post("/export-csv")
    def export_csv(self, request, data: ExportCSVRequestSchema):
        """Export finance data as CSV"""
        csv_content = self.csv_service.generate_export_csv(
            user=request.user,
            start_date=data.startDate,
            end_date=data.endDate,
            months_to_show=data.monthsToShow
        )
        
        response = HttpResponse(csv_content, content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="balance-report-{data.startDate}-to-{data.endDate}.csv"'
        return response

    @route.post("/import-csv", response={200: dict, 400: dict})
    def import_csv(self, request, file: UploadedFile = File(...)):
        """Import bills from CSV file"""
        try:
            imported_bills = self.csv_service.import_bills_from_csv(
                file=file,
                user=request.user
            )
            
            return 200, {
                'message': 'Bills imported successfully',
                'imported_count': len(imported_bills),
                'bills': [bill.id for bill in imported_bills]
            }
        except Exception as e:
            return 400, {'error': str(e)}

    @route.post("/balance-projection", response=List[dict])
    def get_balance_projection(self, request, data: BalanceProjectionRequestSchema):
        """Get balance projections for future dates"""
        projections = self.calendar_service.get_balance_projections(
            user=request.user,
            months=data.projectionMonths
        )
        return projections