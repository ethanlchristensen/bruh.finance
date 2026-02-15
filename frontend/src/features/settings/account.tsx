"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  getAccount,
  updateAccount,
  initializeAccount,
} from "@/lib/finance-api";
import { Loader2 } from "lucide-react";

export default function FinanceSettingsPage() {
  const [balance, setBalance] = useState("");
  const [balanceDate, setBalanceDate] = useState(() => {
    // Default to today
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isNewAccount, setIsNewAccount] = useState(false);

  useEffect(() => {
    async function loadAccount() {
      try {
        const account = await getAccount();
        setBalance(account.currentBalance.toString());
        setBalanceDate(account.balanceAsOfDate);
        setIsNewAccount(false);
      } catch (error) {
        console.error("Failed to load account:", error);
        // Assuming 404 means no account yet
        setIsNewAccount(true);
      } finally {
        setIsLoading(false);
      }
    }
    loadAccount();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const balanceNum = Number.parseFloat(balance) || 0;

      if (isNewAccount) {
        console.log("Creating new account...");
        await initializeAccount(balanceNum, balanceDate);
      } else {
        console.log("Updating existing account...");
        const result = await updateAccount({
          currentBalance: balanceNum,
          startingBalance: balanceNum,
          balanceAsOfDate: balanceDate,
        });
        console.log("Account updated:", result);
      }

      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Failed to save account settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isNewAccount ? "Setup Finance Account" : "Update Account Balance"}
          </CardTitle>
          <CardDescription className="text-center">
            {isNewAccount
              ? "Enter your checking account balance to get started"
              : "Update your current balance to recalibrate the dashboard"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="balance">Current Balance</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="pl-7"
                  required
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Enter your current checking account balance
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="balanceDate">Balance As Of Date</Label>
              <Input
                id="balanceDate"
                type="date"
                value={balanceDate}
                onChange={(e) => setBalanceDate(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                The date this balance is accurate as of
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isNewAccount ? "Create Account" : "Update Balance"}
            </Button>

            {!isNewAccount && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => (window.location.href = "/dashboard")}
              >
                Cancel
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
