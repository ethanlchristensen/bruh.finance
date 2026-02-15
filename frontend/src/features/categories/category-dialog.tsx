import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAddCategory,
  useUpdateCategory,
  useCategoryChoices,
} from "@/hooks/use-categories";
import { Loader2 } from "lucide-react";
import type { Category } from "@/lib/finance-api";

interface CategoryDialogProps {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Fallback constants if API fails
const FALLBACK_TYPES = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "bill", label: "Bill" },
  { value: "general", label: "General" },
];

const FALLBACK_COLORS = [
  { value: "red-500", label: "Red" },
  { value: "rose-500", label: "Rose" },
  { value: "orange-500", label: "Orange" },
  { value: "amber-500", label: "Amber" },
  { value: "yellow-500", label: "Yellow" },
  { value: "lime-500", label: "Lime" },
  { value: "green-500", label: "Green" },
  { value: "emerald-500", label: "Emerald" },
  { value: "teal-500", label: "Teal" },
  { value: "cyan-500", label: "Cyan" },
  { value: "sky-500", label: "Sky" },
  { value: "blue-500", label: "Blue" },
  { value: "indigo-500", label: "Indigo" },
  { value: "violet-500", label: "Violet" },
  { value: "purple-500", label: "Purple" },
  { value: "fuchsia-500", label: "Fuchsia" },
  { value: "pink-500", label: "Pink" },
  { value: "gray-500", label: "Gray" },
];

export function CategoryDialog({
  category,
  open,
  onOpenChange,
}: CategoryDialogProps) {
  const isEditing = !!category;
  const { data: choices, isLoading: isLoadingChoices } = useCategoryChoices();
  const { mutate: addCategory, isPending: isAdding } = useAddCategory();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory();

  const [formData, setFormData] = useState<Omit<Category, "id">>({
    name: "",
    type: "general",
    color: "bg-gray-500",
  });

  const [prevCategory, setPrevCategory] = useState<Category | null>(null);
  const [prevOpen, setPrevOpen] = useState(false);

  if (category !== prevCategory || (open !== prevOpen && open)) {
    setPrevCategory(category);
    setPrevOpen(open);
    if (category) {
      setFormData({
        name: category.name,
        type: category.type,
        color: category.color,
      });
    } else {
      setFormData({
        name: "",
        type: "general",
        color: "bg-gray-500",
      });
    }
  } else if (open !== prevOpen) {
    setPrevOpen(open);
  }

  const handleSave = () => {
    if (isEditing && category) {
      updateCategory(
        { id: category.id, category: formData },
        {
          onSuccess: () => onOpenChange(false),
        },
      );
    } else {
      addCategory(formData, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isPending = isAdding || isUpdating;
  const types =
    choices?.types && choices.types.length > 0 ? choices.types : FALLBACK_TYPES;
  const colors =
    choices?.colors && choices.colors.length > 0
      ? choices.colors
      : FALLBACK_COLORS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Category" : "Create Category"}
          </DialogTitle>
          <DialogDescription>
            Categories help you organize your bills, expenses, and income.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g. Groceries, Utilities, Salary"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue
                    placeholder={
                      isLoadingChoices ? "Loading..." : "Select type"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {types.map((choice) => (
                    <SelectItem key={choice.value} value={choice.value}>
                      {choice.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Select
                value={formData.color}
                onValueChange={(value) =>
                  setFormData({ ...formData, color: value })
                }
              >
                <SelectTrigger id="color">
                  <SelectValue
                    placeholder={
                      isLoadingChoices ? "Loading..." : "Select color"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {colors.map((choice) => (
                    <SelectItem key={choice.value} value={choice.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-4 w-4 rounded-full bg-${choice.value}`}
                        />
                        {choice.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending || !formData.name}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Category"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
