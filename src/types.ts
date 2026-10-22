/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BudgetItem {
  id: string;
  name: string;
  cost: number;
  value: number; // 1 to 10
  isPurchased: boolean;
  createdAt: number;
}

export interface PresetDemo {
  id: string;
  name: string;
  description: string;
  budget: number;
  items: Omit<BudgetItem, 'id' | 'createdAt'>[];
}

export interface BackendSelectedItem {
  id: string;
  name: string;
  cost: number;
  value: number;
}

export interface BackendExcludedItem {
  id: string;
  name: string;
  cost: number;
  value: number;
  reason: string;
}

export interface BackendOptimizationResult {
  selectedIds: string[];
  excludedIds: string[];
  selectedItems: BackendSelectedItem[];
  excludedItems: BackendExcludedItem[];
  totalCost: number;
  totalValue: number;
  remainingBudget: number;
  budgetCapacity: number;
  itemCount: number;
  executionTimeMs: number;
  backend: string;
}

export interface BackendHealthResponse {
  status: string;
  service: string;
  algorithm: string;
  version: string;
}
