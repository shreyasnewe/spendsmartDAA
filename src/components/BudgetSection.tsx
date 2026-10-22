/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { formatINR } from '../services/api';

const MAX_SAFE_BUDGET = 25000;

interface BudgetSectionProps {
  totalBudget: number;
  purchasedTotal: number;
  onUpdateBudget: (newBudget: number) => { success: boolean; error?: string };
  onResetAll: () => void;
  onLoadPreset: (presetId: string) => void;
}

export const BudgetSection: React.FC<BudgetSectionProps> = ({
  totalBudget,
  purchasedTotal,
  onUpdateBudget,
  onResetAll,
  onLoadPreset,
}) => {
  const [inputValue, setInputValue] = useState<string>(totalBudget.toString());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setInputValue(totalBudget.toString());
  }, [totalBudget]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const parsed = parseInt(inputValue.trim(), 10);

    if (isNaN(parsed) || parsed <= 0) {
      setErrorMessage('Please enter a valid positive integer amount in rupees.');
      return;
    }

    if (parsed > MAX_SAFE_BUDGET) {
      setErrorMessage(
        `Budget cannot exceed ${formatINR(MAX_SAFE_BUDGET)} to preserve O(nW) memory performance in the C++ Dynamic Programming engine.`
      );
      return;
    }

    if (parsed < purchasedTotal) {
      setErrorMessage(
        `New budget (${formatINR(parsed)}) cannot be less than already recorded purchases (${formatINR(purchasedTotal)}). Unmark or remove purchased items first.`
      );
      return;
    }

    const result = onUpdateBudget(parsed);
    if (!result.success) {
      setErrorMessage(result.error || 'Failed to update budget.');
    } else {
      setSuccessMessage(`Budget successfully updated to ${formatINR(parsed)}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const remainingBudget = Math.max(0, totalBudget - purchasedTotal);

  return (
    <section className="bg-white border border-stone-200 rounded-xl p-5 md:p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800">
            Section A · Budget Configuration
          </span>
          <h2 className="text-xl font-semibold text-stone-900 mt-0.5">
            Available Budget & Funds
          </h2>
        </div>

        {/* Sample Presets Menu */}
        <div className="flex items-center gap-2 text-xs text-stone-600 flex-wrap">
          <span className="font-medium text-stone-500">Sample Presets:</span>
          <button
            type="button"
            onClick={() => onLoadPreset('greedy-counterexample')}
            className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors font-medium cursor-pointer"
            title="Load preset where Greedy fails and DP yields optimal answer"
          >
            Greedy Counterexample (₹500)
          </button>
          <button
            type="button"
            onClick={() => onLoadPreset('student-essentials')}
            className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors font-medium cursor-pointer"
          >
            Student Monthly (₹800)
          </button>
          <button
            type="button"
            onClick={onResetAll}
            className="px-2.5 py-1 rounded border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
            title="Reset to fresh blank slate"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form to update budget */}
        <form onSubmit={handleSubmit} className="lg:col-span-6 space-y-3">
          <label
            htmlFor="budget-input"
            className="block text-sm font-medium text-stone-800"
          >
            Available budget (₹)
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-medium">
                ₹
              </span>
              <input
                id="budget-input"
                type="number"
                min="1"
                max={MAX_SAFE_BUDGET}
                step="1"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="e.g. 1000"
                className="w-full pl-8 pr-3 py-2 text-base font-medium rounded-lg border border-stone-300 bg-stone-50/50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 tabular-nums"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs"
            >
              Update budget
            </button>
          </div>

          {errorMessage && (
            <p className="text-xs text-rose-600 font-medium mt-1">
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <p className="text-xs text-emerald-700 font-medium mt-1">
              {successMessage}
            </p>
          )}

          <p className="text-xs text-stone-500">
            Integer budget in rupees. Knapsack DP capacity limit W is set to{' '}
            <span className="font-medium text-stone-700">
              {formatINR(remainingBudget)}
            </span>
            .
          </p>
        </form>

        {/* Small Summary Card */}
        <div className="lg:col-span-6 bg-stone-50/70 border border-stone-200/80 rounded-lg p-4">
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
            Budget Balance Summary
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2 bg-white rounded border border-stone-200">
              <span className="block text-xs text-stone-500">Total Budget</span>
              <span className="text-sm md:text-base font-semibold text-stone-900 tabular-nums">
                {formatINR(totalBudget)}
              </span>
            </div>

            <div className="p-2 bg-white rounded border border-stone-200">
              <span className="block text-xs text-stone-500">Paid Expenses</span>
              <span className="text-sm md:text-base font-semibold text-stone-600 tabular-nums">
                {formatINR(purchasedTotal)}
              </span>
            </div>

            <div className="p-2 bg-emerald-50/60 rounded border border-emerald-200/70">
              <span className="block text-xs text-emerald-800 font-medium">
                Remaining Funds
              </span>
              <span className="text-sm md:text-base font-bold text-emerald-800 tabular-nums">
                {formatINR(remainingBudget)}
              </span>
            </div>
          </div>

          {purchasedTotal > 0 && (
            <p className="text-xs text-stone-500 mt-2.5">
              • {formatINR(purchasedTotal)} is already spent on purchased items and deducted from available capacity.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
