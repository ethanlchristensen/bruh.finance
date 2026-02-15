from typing import List

from ninja_extra import api_controller, route
from ninja_jwt.authentication import JWTAuth

from api.features.finance.models import CATEGORY_TYPE_CHOICES, TAILWIND_BG_COLOR_CHOICES, Category
from api.features.finance.schemas import CategoryChoicesSchema, CategorySchema


@api_controller("/finance/categories", auth=JWTAuth(), tags=["Categories"])
class CategoryController:
    @route.get("", response=List[CategorySchema])
    def list_categories(self, request):
        """List all categories for current user"""
        return Category.objects.filter(user=request.user)

    @route.get("/choices", response=CategoryChoicesSchema)
    def get_choices(self, request):
        return {
            "colors": [
                {"value": choice[0], "label": choice[1]} for choice in TAILWIND_BG_COLOR_CHOICES
            ],
            "types": [{"value": choice[0], "label": choice[1]} for choice in CATEGORY_TYPE_CHOICES],
        }

    @route.get("/{category_id}", response=CategorySchema)
    def get_category(self, request, category_id: int):
        """Get a specific category"""
        return Category.objects.get(id=category_id, user=request.user)

    @route.post("", response={201: CategorySchema, 400: dict})
    def create_category(self, request, data: CategorySchema):
        """Create a new category"""
        category = Category.objects.create(
            user=request.user, **data.dict(exclude_unset=True, exclude={"id"})
        )
        return 201, category

    @route.put("/{category_id}", response=CategorySchema)
    def update_category(self, request, category_id: int, data: CategorySchema):
        """Update a category"""
        category = Category.objects.get(id=category_id, user=request.user)
        for attr, value in data.dict(exclude_unset=True, exclude={"id"}).items():
            setattr(category, attr, value)
        category.save()
        return category

    @route.delete("/{category_id}", response={204: None})
    def delete_category(self, request, category_id: int):
        """Delete a category"""
        category = Category.objects.get(id=category_id, user=request.user)
        category.delete()
        return 204, None
