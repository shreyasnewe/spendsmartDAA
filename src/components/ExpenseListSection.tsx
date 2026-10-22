/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BudgetItem } from '../types';
import { formatINR } from '../services/api';
import { Trash2, CheckCircle2, RotateCcw } from 'lucide-react';

interface ExpenseListSectionProps {
  items: BudgetItem[];
  remainingBudget: number;
  onTogglePurchased: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onClearAllItems: () => void;
}

export const ExpenseListSection: React.FC<ExpenseListSectionProps> = ({
  items,
  remainingBudget,
  onTogglePurchased,
  onRemoveItem,
  onClearAllItems,
}) => {
  const unpurchasedItems = items.filter((item) => !item.isPurchased);
  const purchasedItems = items.filter((item) => item.isPurchased);

  const totalPlannedCost = unpurchasedItems.reduce((acc, it) => acc + it.cost, 0);
  const fitsInBudget = totalPlannedCost <= remainingBudget;
  const deficit = totalPlannedCost - remainingBudget;

  return (
    <section className="bg-white border border-stone-200 rounded-xl p-5 md:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800">
            Section C · Expense Roster
          </span>
          <h2 className="text-xl font-semibold text-stone-900 mt-0.5">
            Planned Purchases & Recorded Expenses
          </h2>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={onClearAllItems}
            className="text-xs text-stone-500 hover:text-rose-600 transition-colors self-start sm:self-auto cursor-pointer"
          >
            Clear list ({items.length})
          </button>
        )}
      </div>

      {/* Aggregate Overview Bar */}
      <div className="mt-4 p-4 rounded-lg bg-stone-50/70 border border-stone-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap text-sm">
          <div>
            <span className="text-stone-500 text-xs block">Candidate Planned Items</span>
            <span className="font-semibold text-stone-900 tabular-nums">
              {unpurchasedItems.length} {unpurchasedItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div className="h-7 w-[1px] bg-stone-200 hidden sm:block" />
          <div>
            <span className="text-stone-500 text-xs block">Total Planned Cost</span>
            <span className="font-semibold text-stone-900 tabular-nums">
              {formatINR(totalPlannedCost)}
            </span>
          </div>
          <div className="h-7 w-[1px] bg-stone-200 hidden sm:block" />
          <div>
            <span className="text-stone-500 text-xs block">Available Budget</span>
            <span className="font-semibold text-emerald-800 tabular-nums">
              {formatINR(remainingBudget)}
            </span>
          </div>
        </div>

        {/* Budget fit status note */}
        <div className="text-xs md:text-right">
          {items.length === 0 ? (
            <span className="text-stone-500">No items added yet</span>
          ) : unpurchasedItems.length === 0 ? (
            <span className="text-stone-500">All added items are marked as purchased</span>
          ) : fitsInBudget ? (
            <span className="text-emerald-800 font-medium inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
              All planned items fit within budget (surplus: {formatINR(remainingBudget - totalPlannedCost)})
            </span>
          ) : (
            <span className="text-amber-800 font-medium inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600 inline-block" />
              Exceeds available budget by {formatINR(deficit)} — Knapsack optimization required!
            </span>
          )}
        </div>
      </div>

      {/* Items Table / List */}
      <div className="mt-4 overflow-x-auto">
        {items.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-stone-200 rounded-lg text-stone-500 text-sm">
            <p className="font-medium text-stone-700">No expenses or planned purchases yet</p>
            <p className="text-xs text-stone-500 mt-1">
              Add candidate items using the form above or pick a Viva preset from Section A.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500 text-xs uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Item Name</th>
                <th className="py-2.5 px-3 text-right">Cost (₹)</th>
                <th className="py-2.5 px-3 text-center">Value Score</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {items.map((item) => {
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      item.isPurchased
                        ? 'bg-stone-50/60 text-stone-500'
                        : 'hover:bg-stone-50/40 text-stone-900'
                    }`}
                  >
                    {/* Item Name */}
                    <td className="py-3 px-3 font-medium">
                      <div className="flex items-center gap-2">
                        <span className={item.isPurchased ? 'line-through text-stone-400' : ''}>
                          {item.name}
                        </span>
                        {item.isPurchased && (
                          <span className="text-xs text-stone-500 font-normal">
                            (Paid)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Cost */}
                    <td className="py-3 px-3 text-right font-semibold tabular-nums">
                      {formatINR(item.cost)}
                    </td>

                    {/* Priority/Value Score */}
                    <td className="py-3 px-3 text-center tabular-nums">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <span className="text-stone-800">{item.value}</span>
                        <span className="text-stone-400 text-xs">/10</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      {item.isPurchased ? (
                        <span className="text-xs font-medium text-stone-500">
                          Deducted from budget
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-emerald-800">
                          Planned (In optimization pool)
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-2">
                        {item.isPurchased ? (
                          <button
                            type="button"
                            onClick={() => onTogglePurchased(item.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-stone-200 text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                            title="Undo purchase and restore as candidate planned item"
                          >
                            <RotateCcw className="w-3 h-3 text-stone-500" />
                            <span>Undo</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onTogglePurchased(item.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 transition-colors cursor-pointer"
                            title="Mark as actually paid (deducts from budget and excludes from future optimization)"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Mark as purchased</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                          title="Remove item"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-3 text-xs text-stone-500">
        • Note: Planned purchases are not deducted from available balance until marked as purchased.
      </div>
    </section>
  );
};
