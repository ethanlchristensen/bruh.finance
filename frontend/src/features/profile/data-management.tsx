"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { exportData, importData, type ExportData } from "@/lib/finance-api";
import { Download, Upload, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function DataManagement() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importFileData, setImportFileData] = useState<ExportData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bruh-finance-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Export Successful", {
        description: "Your finance data has been exported to a JSON file.",
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export Failed", {
        description: "An error occurred while exporting your data.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setImportFileData(json);
        setShowImportConfirm(true);
      } catch (error) {
        console.error("Failed to parse JSON:", error);
        toast.error("Invalid File", {
          description: "The selected file is not a valid JSON export.",
        });
      }
    };
    reader.readAsText(file);

    // Reset file input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImport = async () => {
    if (!importFileData) return;

    setIsImporting(true);
    setShowImportConfirm(false);

    try {
      await importData(importFileData);
      toast.success("Import Successful", {
        description: "All your data has been replaced with the imported data.",
      });
      // Optionally reload or redirect
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    } catch (error) {
      console.error("Import failed:", error);
      toast.error("Import Failed", {
        description: "An error occurred while importing your data.",
      });
    } finally {
      setIsImporting(false);
      setImportFileData(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>
          Export your data for backup or move it to another instance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Export Data</p>
              <p className="text-sm text-muted-foreground">
                Download all your finance data as a JSON file.
              </p>
            </div>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              variant="outline"
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export JSON
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Import Data
              </p>
              <p className="text-sm text-muted-foreground">
                Overwrite all current data with a previously exported JSON file.
              </p>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              variant="destructive"
            >
              {isImporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Import JSON
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".json"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <AlertDialog
          open={showImportConfirm}
          onOpenChange={setShowImportConfirm}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Dangerous Action
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will <strong>PERMANENTLY DELETE</strong> all your current
                finance data, including categories, accounts, bills, and
                transactions. They will be replaced with the data from the
                imported file.
                <br />
                <br />
                Are you absolutely sure you want to continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setImportFileData(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleImport}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, Overwrite My Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
