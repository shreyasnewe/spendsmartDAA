/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BackendHealthResponse, BackendOptimizationResult } from '../types';

/**
 * Checks the status of the C++ HTTP Backend.
 */
export async function checkBackendHealth(): Promise<BackendHealthResponse> {
  const response = await fetch('/api/health', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`C++ Backend returned HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Sends budget and items to the C++ 0/1 Knapsack optimization endpoint.
 */
export async function optimizeBudgetViaCpp(
  budget: number,
  items: Array<{ id: string; name: string; cost: number; value: number }>
): Promise<BackendOptimizationResult> {
  const response = await fetch('/api/optimize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      budget,
      items,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || `Backend error (HTTP ${response.status})`;
    throw new Error(errorMsg);
  }

  return data as BackendOptimizationResult;
}

/**
 * Format currency in Indian Rupees format (e.g. ₹1,500)
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
