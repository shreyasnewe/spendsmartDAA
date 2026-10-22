/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PresetDemo } from '../types';

export const SAMPLE_PRESETS: PresetDemo[] = [
  {
    id: 'student-essentials',
    name: 'Student Monthly Plan (Default)',
    description: 'Real-world college student expenses to optimize within ₹800 budget.',
    budget: 800,
    items: [
      { name: 'Groceries', cost: 300, value: 9, isPurchased: false },
      { name: 'Headphones', cost: 500, value: 6, isPurchased: false },
      { name: 'Notebook & Pens', cost: 100, value: 7, isPurchased: false },
      { name: 'Weekend Movie', cost: 250, value: 4, isPurchased: false },
      { name: 'Campus Cafeteria Pass', cost: 150, value: 8, isPurchased: false },
    ],
  },
  {
    id: 'greedy-counterexample',
    name: 'Greedy Counterexample Case',
    description: 'Classic case where Greedy heuristic (Value/Cost ratio) fails to find the global optimum, while 0/1 Knapsack DP achieves maximum value.',
    budget: 500,
    items: [
      { name: 'Item A (High Ratio Single Item)', cost: 300, value: 8, isPurchased: false }, // ratio = 8/300 = 0.0267
      { name: 'Item B (Medium Cost Item)', cost: 250, value: 6, isPurchased: false },       // ratio = 6/250 = 0.0240
      { name: 'Item C (Medium Cost Item)', cost: 250, value: 6, isPurchased: false },       // ratio = 6/250 = 0.0240
    ],
  },
  {
    id: 'tight-budget',
    name: 'Tight Budget Scenario',
    description: 'Tight budget where items compete heavily and some items exceed available budget.',
    budget: 600,
    items: [
      { name: 'Reference Textbook', cost: 450, value: 9, isPurchased: false },
      { name: 'Lab Coat & Tools', cost: 350, value: 8, isPurchased: false },
      { name: 'Scientific Calculator', cost: 250, value: 7, isPurchased: false },
      { name: 'USB Flash Drive', cost: 200, value: 5, isPurchased: false },
      { name: 'Hostel Kettle', cost: 650, value: 6, isPurchased: false }, // Exceeds budget alone
    ],
  },
];
