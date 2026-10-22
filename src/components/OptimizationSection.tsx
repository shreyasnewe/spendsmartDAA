/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BackendOptimizationResult } from '../types';
import { formatINR } from '../services/api';
import {
  Sparkles,
  Check,
  X,
  RotateCcw,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Info,
} from 'lucide-react';

interface OptimizationSectionProps {
  unpurchasedCount: number;
  remainingBudget: number;
  optimizationResult: BackendOptimizationResult | null;
  isLoading: boolean;
  backendError: string | null;
  isOutdated: boolean;
  onOptimize: () => void;
  onResetRecommendation: () => void;
}

export const OptimizationSection: React.FC<OptimizationSectionProps> = ({
  unpurchasedCount,
  remainingBudget,
  optimizationResult,
  isLoading,
  backendError,
  isOutdated,
  onOptimize,
  onResetRecommendation,
}) => {
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);

  return (
    <section className="bg-white border border-stone-200 rounded-xl p-5 md:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-100">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            <span>C++ 0/1 Knapsack Optimizer</span>
          </span>
          <h2 className="text-xl font-semibold text-stone-900 mt-0.5">
            Optimize My Budget
          </h2>
        </div>
        <p className="text-xs text-stone-500">
          C++ HTTP API: <code className="font-mono bg-stone-100 px-1 py-0.5 rounded text-stone-700">POST /api/optimize</code>
        </p>
      </div>

      {/* Outdated Notice */}
      {isOutdated && optimizationResult && (
        <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Your budget or items list changed since the last optimization. Click below to recalculate with the C++ backend.
            </span>
          </div>
          <button
            type="button"
            onClick={onOptimize}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-200/80 hover:bg-amber-300 text-amber-900 transition-colors whitespace-nowrap cursor-pointer"
          >
            Update
          </button>
        </div>
      )}

      {/* Backend Error Alert */}
      {backendError && (
        <div className="mt-4 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block text-sm">C++ Backend Error:</span>
            <p className="mt-0.5 text-rose-800">{backendError}</p>
            <p className="mt-1 text-[11px] text-rose-600">
              Ensure the C++ server is running on port 5000 (<code className="font-mono bg-rose-100/70 px-1 py-0.5 rounded">./backend/spendsmart_server 5000</code>).
            </p>
          </div>
        </div>
      )}

      {/* Primary Action Button */}
      <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={onOptimize}
          disabled={unpurchasedCount === 0 || remainingBudget <= 0 || isLoading}
          className={`flex-1 w-full sm:w-auto py-3.5 px-6 rounded-lg text-base font-semibold text-white transition-all shadow-sm flex items-center justify-center gap-2 ${
            unpurchasedCount === 0 || remainingBudget <= 0 || isLoading
              ? 'bg-stone-300 cursor-not-allowed opacity-80'
              : 'bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] cursor-pointer'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 text-emerald-200 animate-spin" />
              <span>Running C++ DP Engine...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-emerald-200" />
              <span>Find My Best Spending Plan</span>
            </>
          )}
        </button>

        {optimizationResult && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onOptimize}
              disabled={isLoading}
              className="px-4 py-3 text-sm font-medium rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 transition-colors cursor-pointer"
            >
              Recalculate
            </button>
            <button
              type="button"
              onClick={onResetRecommendation}
              className="p-3 text-sm font-medium rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
              title="Reset recommendation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Helper notices */}
      {unpurchasedCount === 0 && !optimizationResult && (
        <p className="text-xs text-stone-500 mt-2">
          Add at least one unpurchased planned item above to run the C++ optimization engine.
        </p>
      )}
      {unpurchasedCount > 0 && remainingBudget <= 0 && !optimizationResult && (
        <p className="text-xs text-rose-600 font-medium mt-2">
          Remaining budget is ₹0. Please increase your total budget in Section A.
        </p>
      )}

      {/* Results Panel */}
      {optimizationResult && (
        <div className="mt-6 pt-6 border-t border-stone-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Optimal Selection from C++ Engine
              </span>
              <h3 className="text-lg font-bold text-stone-900">
                Recommended Spending Allocation
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 font-mono bg-stone-100 px-2 py-1 rounded">
                Solved in {optimizationResult.executionTimeMs.toFixed(3)} ms
              </span>
            </div>
          </div>

          <div className="text-xs text-stone-600 bg-stone-50 border border-stone-200/80 rounded-lg p-3 mb-5">
            <strong>Advisory Note:</strong> The items below represent the mathematically optimal combination computed by the C++ backend, yielding the highest possible priority score within your budget capacity of {formatINR(optimizationResult.budgetCapacity)}. These items are <span className="underline font-semibold">not automatically marked as purchased</span>.
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
              <span className="block text-xs text-emerald-800 font-medium">
                Total Recommended Cost
              </span>
              <span className="text-lg md:text-xl font-bold text-emerald-900 tabular-nums">
                {formatINR(optimizationResult.totalCost)}
              </span>
              <span className="text-[11px] text-emerald-700 block mt-0.5">
                of {formatINR(optimizationResult.budgetCapacity)} capacity
              </span>
            </div>

            <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-lg">
              <span className="block text-xs text-stone-500 font-medium">
                Total Value Score
              </span>
              <span className="text-lg md:text-xl font-bold text-stone-900 tabular-nums">
                {optimizationResult.totalValue} pts
              </span>
              <span className="text-[11px] text-stone-500 block mt-0.5">
                Maximized priority score
              </span>
            </div>

            <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-lg">
              <span className="block text-xs text-stone-500 font-medium">
                Remaining Budget
              </span>
              <span className="text-lg md:text-xl font-bold text-stone-800 tabular-nums">
                {formatINR(optimizationResult.remainingBudget)}
              </span>
              <span className="text-[11px] text-stone-500 block mt-0.5">
                Unspent surplus
              </span>
            </div>

            <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-lg">
              <span className="block text-xs text-stone-500 font-medium">
                Selection Ratio
              </span>
              <span className="text-lg md:text-xl font-bold text-stone-900 tabular-nums">
                {optimizationResult.selectedItems.length} / {optimizationResult.itemCount}
              </span>
              <span className="text-[11px] text-stone-500 block mt-0.5">
                {optimizationResult.excludedItems.length} excluded
              </span>
            </div>
          </div>

          {/* Selected Items */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2.5 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-700" />
              <span>Selected Optimal Combination ({optimizationResult.selectedItems.length})</span>
            </h4>

            {optimizationResult.selectedItems.length === 0 ? (
              <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 text-stone-600 text-xs">
                No items could fit within the available budget of {formatINR(remainingBudget)}. All individual item costs exceed available funds.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {optimizationResult.selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/30 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-stone-900 text-sm">{item.name}</div>
                      <div className="text-xs text-stone-500 mt-0.5">
                        Priority: <strong className="text-emerald-900">{item.value}/10</strong> · Cost: <strong className="text-stone-800">{formatINR(item.cost)}</strong>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-900 rounded">
                      Included
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Excluded Items with Reasons */}
          {optimizationResult.excludedItems.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2.5 flex items-center gap-1.5">
                <X className="w-4 h-4 text-stone-400" />
                <span>Excluded Items ({optimizationResult.excludedItems.length})</span>
              </h4>

              <div className="space-y-2">
                {optimizationResult.excludedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-stone-200 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-medium text-stone-800 text-sm flex items-center gap-2">
                        <span>{item.name}</span>
                        <span className="text-xs text-stone-500 font-normal">
                          ({formatINR(item.cost)} · Value {item.value}/10)
                        </span>
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5">
                        {item.reason}
                      </div>
                    </div>
                    <span className="text-xs text-stone-500 whitespace-nowrap self-start sm:self-auto font-mono">
                      Not Selected
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Small Expandable Section Explaining the 0/1 Knapsack Algorithm */}
      <div className="mt-6 pt-4 border-t border-stone-100">
        <button
          type="button"
          onClick={() => setIsExplainerOpen(!isExplainerOpen)}
          className="w-full flex items-center justify-between text-left py-2 px-1 text-xs font-semibold text-stone-700 hover:text-stone-900 transition-colors cursor-pointer select-none"
        >
          <span className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-emerald-800" />
            <span>How the C++ 0/1 Knapsack Algorithm Works</span>
          </span>
          {isExplainerOpen ? (
            <ChevronUp className="w-4 h-4 text-stone-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-stone-500" />
          )}
        </button>

        {isExplainerOpen && (
          <div className="mt-3 p-4 bg-stone-50 rounded-lg border border-stone-200 text-xs text-stone-700 space-y-3 leading-relaxed">
            <div>
              <span className="font-semibold text-stone-900 block mb-1">
                1. Problem Formulation
              </span>
              <p>
                In SpendSmart, your <strong>remaining budget</strong> acts as the knapsack capacity (<code className="font-mono bg-white px-1 py-0.5 rounded border border-stone-200">W</code> in integer rupees). Each planned purchase represents an item with an integer cost (<code className="font-mono bg-white px-1 py-0.5 rounded border border-stone-200">cost[i]</code>) and a priority rating (<code className="font-mono bg-white px-1 py-0.5 rounded border border-stone-200">value[i]</code>).
              </p>
            </div>

            <div>
              <span className="font-semibold text-stone-900 block mb-1">
                2. Dynamic Programming Recurrence
              </span>
              <div className="p-2.5 bg-white rounded border border-stone-200 font-mono text-[11px] text-stone-800 overflow-x-auto">
                <div>// DP[i][w]: max value using first i items within budget capacity w</div>
                <div>If cost[i] &gt; w:</div>
                <div className="pl-4">DP[i][w] = DP[i - 1][w]</div>
                <div>Otherwise:</div>
                <div className="pl-4 text-emerald-800 font-semibold">
                  DP[i][w] = max(DP[i - 1][w], value[i] + DP[i - 1][w - cost[i]])
                </div>
              </div>
            </div>

            <div>
              <span className="font-semibold text-stone-900 block mb-1">
                3. Backtracking Reconstruction
              </span>
              <p>
                Starting at cell <code className="font-mono bg-white px-1 py-0.5 rounded border border-stone-200">DP[n][W]</code>, if <code className="font-mono bg-white px-1 py-0.5 rounded border border-stone-200">DP[i][w] != DP[i-1][w]</code>, item <code className="font-mono bg-white px-1 py-0.5 rounded border border-stone-200">i</code> was chosen. The C++ server decrements <code className="font-mono bg-white px-1 py-0.5 rounded border border-stone-200">w -= cost[i]</code> and backtracks to item <code className="font-mono bg-white px-1 py-0.5 rounded border border-stone-200">i - 1</code>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 bg-white rounded border border-stone-200">
                <strong>Time Complexity:</strong> O(n · W)
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Computes each state transition in O(1) operations.
                </div>
              </div>
              <div className="p-2.5 bg-white rounded border border-stone-200">
                <strong>Space Complexity:</strong> O(n · W)
                <div className="text-[11px] text-stone-500 mt-0.5">
                  (n + 1) × (W + 1) matrix for exact item backtracking.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
