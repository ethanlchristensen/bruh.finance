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
  getSavingsAccount,
  updateSavingsAccount,
} from "@/lib/finance-api";
import { Loader2 } from "lucide-react";

// Move utilities outside the component
const getTodayString = () => new Date().toISOString().split("T")[0];

const formatAmount = (value?: number | null) => {
  if (value === null || value === undefined) {
    return "0.00";
  }
  return Number(value).toFixed(2);
};

const normalizeDate = (value?: string | null) => value ?? getTodayString();

export default function FinanceSettingsPage() {
  const [balance, setBalance] = useState("0.00");
  const [balanceDate, setBalanceDate] = useState(getTodayString);
  const [savingsBalance, setSavingsBalance] = useState("");
  const [savingsBalanceDate, setSavingsBalanceDate] = useState(getTodayString);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isNewAccount, setIsNewAccount] = useState(false);

  useEffect(() => {
    async function loadAccount() {
      try {
        const account = await getAccount();
        setBalance(formatAmount(account.currentBalance));
        setBalanceDate(normalizeDate(account.balanceAsOfDate));
        setIsNewAccount(false);

        try {
          const savingsAccount = await getSavingsAccount();
          setSavingsBalance(formatAmount(savingsAccount.currentBalance));
          setSavingsBalanceDate(normalizeDate(savingsAccount.balanceAsOfDate));
        } catch (savingsError) {
          console.warn("No savings account data found:", savingsError);
          setSavingsBalance("");
          setSavingsBalanceDate(getTodayString());
        }
      } catch (error) {
        console.error("Failed to load account:", error);
        setIsNewAccount(true);
        setBalance("0.00");
        setBalanceDate(getTodayString());
      } finally {
        setIsLoading(false);
      }
    }
    loadAccount();
  }, []); // Dependencies are now empty as the utilities are stable

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const balanceNum = Number.parseFloat(balance) || 0;

      if (isNewAccount) {
        await initializeAccount(balanceNum, balanceDate);
      } else {
        await updateAccount({
          currentBalance: balanceNum,
          startingBalance: balanceNum,
          balanceAsOfDate: balanceDate,
        });
      }

      if (savingsBalance) {
        const savingsNum = Number.parseFloat(savingsBalance) || 0;
        await updateSavingsAccount({
          currentBalance: savingsNum,
          startingBalance: savingsNum,
          balanceAsOfDate: savingsBalanceDate,
        });
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="savingsBalance">Savings Balance (Optional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="savingsBalance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={savingsBalance}
                  onChange={(e) => setSavingsBalance(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="savingsBalanceDate">Savings Balance As Of</Label>
              <Input
                id="savingsBalanceDate"
                type="date"
                value={savingsBalanceDate}
                onChange={(e) => setSavingsBalanceDate(e.target.value)}
                disabled={!savingsBalance}
              />
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