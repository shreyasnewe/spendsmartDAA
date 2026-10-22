/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { BudgetItem, BackendOptimizationResult, BackendHealthResponse } from './types';
import { SAMPLE_PRESETS } from './data/presets';
import { checkBackendHealth, optimizeBudgetViaCpp, formatINR } from './services/api';
import { BudgetSection } from './components/BudgetSection';
import { AddItemSection } from './components/AddItemSection';
import { ExpenseListSection } from './components/ExpenseListSection';
import { OptimizationSection } from './components/OptimizationSection';
import { Wallet, ShieldCheck, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

const STORAGE_KEY_BUDGET = 'spendsmart_budget_v2';
const STORAGE_KEY_ITEMS = 'spendsmart_items_v2';

export default function App() {
  // 1. Core State
  const [totalBudget, setTotalBudget] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BUDGET);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {
      // Ignore
    }
    return 800;
  });

  const [items, setItems] = useState<BudgetItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore
    }
    return [
      { id: 'item-1', name: 'Groceries', cost: 300, value: 9, isPurchased: false, createdAt: Date.now() - 4000 },
      { id: 'item-2', name: 'Headphones', cost: 500, value: 6, isPurchased: false, createdAt: Date.now() - 3000 },
      { id: 'item-3', name: 'Notebook', cost: 100, value: 7, isPurchased: false, createdAt: Date.now() - 2000 },
      { id: 'item-4', name: 'Movie', cost: 250, value: 4, isPurchased: false, createdAt: Date.now() - 1000 },
    ];
  });

  // 2. Optimization and Backend State
  const [optimizationResult, setOptimizationResult] = useState<BackendOptimizationResult | null>(null);
  const [isOptimizationLoading, setIsOptimizationLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isOutdated, setIsOutdated] = useState(false);

  // Backend Health
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [backendInfo, setBackendInfo] = useState<BackendHealthResponse | null>(null);

  // 3. Persist to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BUDGET, totalBudget.toString());
    } catch {
      // Ignore
    }
  }, [totalBudget]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    } catch {
      // Ignore
    }
  }, [items]);

  // 4. Check C++ Backend Health
  const verifyBackend = useCallback(async () => {
    setBackendStatus('checking');
    try {
      const info = await checkBackendHealth();
      setBackendInfo(info);
      setBackendStatus('connected');
    } catch {
      setBackendInfo(null);
      setBackendStatus('disconnected');
    }
  }, []);

  useEffect(() => {
    verifyBackend();
  }, [verifyBackend]);

  // 5. Financial Computations
  const purchasedTotal = useMemo(() => {
    return items
      .filter((item) => item.isPurchased)
      .reduce((sum, item) => sum + item.cost, 0);
  }, [items]);

  const remainingBudget = useMemo(() => {
    return Math.max(0, totalBudget - purchasedTotal);
  }, [totalBudget, purchasedTotal]);

  const unpurchasedItems = useMemo(() => {
    return items.filter((item) => !item.isPurchased);
  }, [items]);

  // When budget or items list changes, mark recommendation as outdated
  const markOutdatedIfActive = () => {
    if (optimizationResult !== null) {
      setIsOutdated(true);
    }
  };

  // 6. Primary Action: Call C++ Backend for Optimization
  const handleRunOptimization = async () => {
    if (unpurchasedItems.length === 0 || remainingBudget <= 0) return;

    setIsOptimizationLoading(true);
    setBackendError(null);

    try {
      const candidatePayload = unpurchasedItems.map((item) => ({
        id: item.id,
        name: item.name,
        cost: item.cost,
        value: item.value,
      }));

      // Call the C++ HTTP server
      const result = await optimizeBudgetViaCpp(remainingBudget, candidatePayload);
      setOptimizationResult(result);
      setIsOutdated(false);
      setBackendStatus('connected');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to C++ backend.';
      setBackendError(msg);
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setBackendStatus('disconnected');
      }
    } finally {
      setIsOptimizationLoading(false);
    }
  };

  // 7. Event Handlers
  const handleUpdateBudget = (newBudget: number): { success: boolean; error?: string } => {
    if (newBudget < purchasedTotal) {
      return {
        success: false,
        error: `Cannot reduce budget to ${formatINR(newBudget)} because already-purchased expenses total ${formatINR(purchasedTotal)}. Please unmark items first.`,
      };
    }
    setTotalBudget(newBudget);
    markOutdatedIfActive();
    return { success: true };
  };

  const handleAddItem = ({ name, cost, value }: { name: string; cost: number; value: number }) => {
    const newItem: BudgetItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      cost,
      value,
      isPurchased: false,
      createdAt: Date.now(),
    };
    setItems((prev) => [...prev, newItem]);
    markOutdatedIfActive();
  };

  const handleTogglePurchased = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, isPurchased: !item.isPurchased };
        }
        return item;
      })
    );
    markOutdatedIfActive();
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    markOutdatedIfActive();
  };

  const handleClearAllItems = () => {
    setItems([]);
    setOptimizationResult(null);
    setIsOutdated(false);
  };

  const handleResetAll = () => {
    setTotalBudget(800);
    setItems([]);
    setOptimizationResult(null);
    setIsOutdated(false);
    localStorage.removeItem(STORAGE_KEY_BUDGET);
    localStorage.removeItem(STORAGE_KEY_ITEMS);
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = SAMPLE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setTotalBudget(preset.budget);
    const hydratedItems: BudgetItem[] = preset.items.map(
      (item: Omit<BudgetItem, 'id' | 'createdAt'>, idx: number) => ({
        ...item,
        id: `preset-${presetId}-${idx}-${Date.now()}`,
        createdAt: Date.now() + idx,
      })
    );
    setItems(hydratedItems);
    setOptimizationResult(null);
    setIsOutdated(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 pb-16">
      {/* Top Banner / Minimal Header */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-xs sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-base shadow-xs">
              <Wallet className="w-4 h-4 text-emerald-100" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-stone-900">
                SpendSmart
              </span>
              <span className="text-stone-400 mx-2 text-xs">/</span>
              <span className="text-xs font-medium text-stone-500">
                C++ Powered Budget Optimizer
              </span>
            </div>
          </div>

          {/* Backend Connection Status Badge */}
          <div className="flex items-center gap-2 text-xs">
            {backendStatus === 'connected' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>C++ Backend Online</span>
                {backendInfo && (
                  <span className="text-emerald-700/80 hidden sm:inline">
                    · v{backendInfo.version}
                  </span>
                )}
              </span>
            ) : backendStatus === 'checking' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100 text-stone-600 font-medium">
                <RefreshCw className="w-3 h-3 animate-spin text-stone-500" />
                <span>Checking C++ server...</span>
              </span>
            ) : (
              <div className="inline-flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-800 font-medium">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>C++ Backend Offline</span>
                </span>
                <button
                  type="button"
                  onClick={verifyBackend}
                  className="p-1 rounded text-stone-500 hover:text-stone-800 hover:bg-stone-100 cursor-pointer"
                  title="Retry backend health check"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Single-Page Content Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        {/* Editorial Hero Statement */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            Make your money work smarter.
          </h1>
          <p className="text-sm sm:text-base text-stone-600 mt-1 max-w-2xl">
            Set your budget. Plan your spending. Optimized via C++ Dynamic Programming.
          </p>
        </div>

        {/* Section A: Budget Input & Management */}
        <BudgetSection
          totalBudget={totalBudget}
          purchasedTotal={purchasedTotal}
          onUpdateBudget={handleUpdateBudget}
          onResetAll={handleResetAll}
          onLoadPreset={handleLoadPreset}
        />

        {/* Section B: Add an Expense or Planned Purchase */}
        <AddItemSection onAddItem={handleAddItem} />

        {/* Section C: Expense List */}
        <ExpenseListSection
          items={items}
          remainingBudget={remainingBudget}
          onTogglePurchased={handleTogglePurchased}
          onRemoveItem={handleRemoveItem}
          onClearAllItems={handleClearAllItems}
        />

        {/* Section D: Optimize My Budget (C++ HTTP API execution) */}
        <OptimizationSection
          unpurchasedCount={unpurchasedItems.length}
          remainingBudget={remainingBudget}
          optimizationResult={optimizationResult}
          isLoading={isOptimizationLoading}
          backendError={backendError}
          isOutdated={isOutdated}
          onOptimize={handleRunOptimization}
          onResetRecommendation={() => {
            setOptimizationResult(null);
            setIsOutdated(false);
          }}
        />

        {/* Quiet Footer */}
        <footer className="pt-6 border-t border-stone-200 text-xs text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            SpendSmart — C++ 0/1 Knapsack Dynamic Programming Backend & React Frontend
          </div>
          <div className="flex items-center gap-1.5 text-stone-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" />
            <span>Single Source of Truth: C++ Knapsack Engine</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
