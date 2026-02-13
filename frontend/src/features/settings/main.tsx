"use client";

import type React from "react";

import { useState } from "react";
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
import { initializeAccount } from "@/lib/finance-api";

export default function SetupPage() {
  const [balance, setBalance] = useState("");
  const [balanceDate, setBalanceDate] = useState(() => {
    // Default to today
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await initializeAccount(Number.parseFloat(balance) || 0, balanceDate);
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Failed to initialize account:", error);
      alert("Failed to set up account. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Welcome to Finance Tracker
          </CardTitle>
          <CardDescription className="text-center">
            Enter your checking account balance and the date it's accurate as of
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="balance">Starting Balance</Label>
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

            <Button type="submit" className="w-full">
              Continue to Dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
