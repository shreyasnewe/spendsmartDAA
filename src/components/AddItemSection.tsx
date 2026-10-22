/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface AddItemSectionProps {
  onAddItem: (item: { name: string; cost: number; value: number }) => void;
}

export const AddItemSection: React.FC<AddItemSectionProps> = ({ onAddItem }) => {
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [value, setValue] = useState('7');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please provide a name for the planned purchase or expense.');
      return;
    }

    const parsedCost = parseInt(cost.trim(), 10);
    if (isNaN(parsedCost) || parsedCost <= 0) {
      setError('Estimated cost must be a positive integer in rupees (e.g. 300).');
      return;
    }

    const parsedValue = parseInt(value.trim(), 10);
    if (isNaN(parsedValue) || parsedValue < 1 || parsedValue > 10) {
      setError('Priority / value score must be an integer between 1 and 10.');
      return;
    }

    onAddItem({
      name: trimmedName,
      cost: parsedCost,
      value: parsedValue,
    });

    // Reset inputs for next rapid entry
    setName('');
    setCost('');
    setValue('7');
  };

  const handleQuickAdd = (sampleName: string, sampleCost: number, sampleVal: number) => {
    onAddItem({
      name: sampleName,
      cost: sampleCost,
      value: sampleVal,
    });
  };

  return (
    <section className="bg-white border border-stone-200 rounded-xl p-5 md:p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-stone-100">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800">
            Section B · Item Formulation
          </span>
          <h2 className="text-xl font-semibold text-stone-900 mt-0.5">
            Add an Expense or Planned Purchase
          </h2>
        </div>
        <p className="text-xs text-stone-500">
          In 0/1 Knapsack: Cost = Weight ($w_i$), Value = Profit/Utility ($v_i$).
        </p>
      </div>

      <form onSubmit={handleAdd} className="mt-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Item Name */}
          <div className="md:col-span-5">
            <label
              htmlFor="item-name"
              className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5"
            >
              Item Name
            </label>
            <input
              id="item-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Groceries, Headphones, Books"
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 bg-stone-50/50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            />
          </div>

          {/* Estimated Cost */}
          <div className="md:col-span-3">
            <label
              htmlFor="item-cost"
              className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5"
            >
              Estimated Cost (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-medium text-sm">
                ₹
              </span>
              <input
                id="item-cost"
                type="number"
                min="1"
                step="1"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="e.g. 300"
                className="w-full pl-7 pr-3 py-2 text-sm rounded-lg border border-stone-300 bg-stone-50/50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 tabular-nums"
              />
            </div>
          </div>

          {/* Priority / Value Score (1-10) */}
          <div className="md:col-span-2">
            <label
              htmlFor="item-value"
              className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5"
            >
              Priority (1-10)
            </label>
            <select
              id="item-value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 bg-stone-50/50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 cursor-pointer font-medium tabular-nums"
            >
              <option value="10">10 · Essential / Critical</option>
              <option value="9">9 · Very High Utility</option>
              <option value="8">8 · High Priority</option>
              <option value="7">7 · Important</option>
              <option value="6">6 · Useful</option>
              <option value="5">5 · Moderate</option>
              <option value="4">4 · Nice to have</option>
              <option value="3">3 · Discretionary</option>
              <option value="2">2 · Low Priority</option>
              <option value="1">1 · Minimal Utility</option>
            </select>
          </div>

          {/* Add Button */}
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full py-2 px-4 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>+ Add item</span>
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-600 font-medium mt-2">
            {error}
          </p>
        )}

        {/* Quick Example Templates */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2 text-xs text-stone-600">
          <span className="text-stone-500 font-medium">Quick examples from brief:</span>
          <button
            type="button"
            onClick={() => handleQuickAdd('Groceries', 300, 9)}
            className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
          >
            + Groceries (₹300, Val 9)
          </button>
          <button
            type="button"
            onClick={() => handleQuickAdd('Headphones', 500, 6)}
            className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
          >
            + Headphones (₹500, Val 6)
          </button>
          <button
            type="button"
            onClick={() => handleQuickAdd('Notebook', 100, 7)}
            className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
          >
            + Notebook (₹100, Val 7)
          </button>
          <button
            type="button"
            onClick={() => handleQuickAdd('Movie', 250, 4)}
            className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
          >
            + Movie (₹250, Val 4)
          </button>
        </div>
      </form>
    </section>
  );
};
