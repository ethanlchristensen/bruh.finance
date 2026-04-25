import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, FileText, X } from "lucide-react";
import { useState, useRef } from "react";

interface ImportCSVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => Promise<void>;
}

export function ImportCSVDialog({
  open,
  onOpenChange,
  onImport,
}: ImportCSVDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    try {
      await onImport(selectedFile);
      onOpenChange(false);
      setSelectedFile(null);
    } catch (error) {
      console.error("Import failed:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Bills from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing your recurring bills. The file should
            have columns for Description, Due Date (Day of month), and Monthly
            Cost.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Click to select CSV file</p>
              <p className="text-xs text-muted-foreground">.csv files only</p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 border rounded-lg bg-accent/30">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm font-medium truncate">
                  {selectedFile.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={clearFile}
                disabled={isImporting}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="bg-muted p-3 rounded-md">
            <h4 className="text-xs font-semibold mb-1 uppercase text-muted-foreground">
              CSV Format Example:
            </h4>
            <code className="text-xs block whitespace-pre">
              Description, Due Date, Monthly Cost, Remaining{"\n"}
              Rent, 1, 1200.00{"\n"}
              Internet, 15, 75.00, 450.00
            </code>
          </div>

          <Button
            onClick={handleImport}
            className="w-full"
            disabled={!selectedFile || isImporting}
          >
            {isImporting ? "Importing..." : "Import CSV"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
