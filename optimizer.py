"""
optimizer.py — 0/1 Knapsack Dynamic Programming Optimizer for SpendSmart.

DAA Mini-Project Core Algorithm:
Solves the 0/1 Knapsack problem where:
- Knapsack capacity W = available budget in Indian Rupees (₹)
- Items = candidate unpurchased planned expenses
- Weight = integer cost in rupees (cost[i])
- Value = user utility/priority score (value[i] in 1..10)

Objective:
Maximize sum(value[i] * x[i]) subject to sum(cost[i] * x[i]) <= W, where x[i] in {0, 1}.

Recurrence Relation:
If cost[i] > w:
    dp[i][w] = dp[i-1][w]
Otherwise:
    dp[i][w] = max(dp[i-1][w], value[i] + dp[i-1][w - cost[i]])

Complexity:
Time:  O(n * W)
Space: O(n * W)
"""

from dataclasses import dataclass, asdict
from typing import List, Dict, Any
import time

# Sensible maximum budget limit to prevent excessive O(n * W) memory allocation
MAX_SAFE_BUDGET = 25000


@dataclass
class Item:
    id: str
    name: str
    cost: int
    value: int  # 1 to 10


@dataclass
class ExcludedItem:
    id: str
    name: str
    cost: int
    value: int
    reason: str


@dataclass
class OptimizationResult:
    selected_items: List[Item]
    excluded_items: List[ExcludedItem]
    total_cost: int
    total_value: int
    remaining_budget: int
    budget_capacity: int
    item_count: int
    execution_time_ms: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def validate_inputs(budget: int, items: List[Item]) -> None:
    """Validates budget and candidate items. Raises ValueError on invalid inputs."""
    if not isinstance(budget, int):
        raise ValueError("Budget must be an integer.")
    if budget < 0:
        raise ValueError("Budget cannot be negative.")
    if budget > MAX_SAFE_BUDGET:
        raise ValueError(
            f"Budget cannot exceed ₹{MAX_SAFE_BUDGET:,} to prevent excessive O(nW) memory allocation."
        )

    seen_ids = set()
    for idx, item in enumerate(items):
        if not item.id or not str(item.id).strip():
            raise ValueError(f"Item at index {idx} has an empty or invalid ID.")
        if item.id in seen_ids:
            raise ValueError(f"Duplicate item ID detected: '{item.id}'.")
        seen_ids.add(item.id)

        if not item.name or not str(item.name).strip():
            raise ValueError(f"Item '{item.id}' cannot have an empty name.")

        if not isinstance(item.cost, int) or item.cost <= 0:
            raise ValueError(
                f"Item '{item.name}' has invalid cost (₹{item.cost}). Cost must be a positive integer."
            )

        if not isinstance(item.value, int) or not (1 <= item.value <= 10):
            raise ValueError(
                f"Item '{item.name}' has invalid value score ({item.value}). Score must be an integer between 1 and 10."
            )


def solve_knapsack(budget: int, items: List[Item]) -> OptimizationResult:
    """
    Solves the 0/1 Knapsack problem using dynamic programming.
    
    Returns an OptimizationResult containing selected items, excluded items with reasons,
    total cost, total utility score, and remaining surplus budget.
    """
    start_time = time.perf_counter()
    validate_inputs(budget, items)

    n = len(items)
    W = budget

    # Edge case 1: No candidate items or zero budget capacity
    if n == 0 or W == 0:
        excluded = [
            ExcludedItem(
                id=item.id,
                name=item.name,
                cost=item.cost,
                value=item.value,
                reason="Available budget capacity is ₹0." if W == 0 else "No budget remaining."
            )
            for item in items
        ]
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return OptimizationResult(
            selected_items=[],
            excluded_items=excluded,
            total_cost=0,
            total_value=0,
            remaining_budget=W,
            budget_capacity=W,
            item_count=n,
            execution_time_ms=round(duration_ms, 3),
        )

    # 1. Initialize (n + 1) x (W + 1) DP table with zeros
    # dp[i][w] = maximum utility obtainable using first i items within budget w
    dp = [[0] * (W + 1) for _ in range(n + 1)]

    # 2. Fill the DP table iteratively
    for i in range(1, n + 1):
        item_cost = items[i - 1].cost
        item_value = items[i - 1].value

        for w in range(W + 1):
            if item_cost > w:
                # Item cost exceeds current sub-capacity w -> cannot include
                dp[i][w] = dp[i - 1][w]
            else:
                # Choose the maximum between excluding or including item i
                dp[i][w] = max(
                    dp[i - 1][w],
                    item_value + dp[i - 1][w - item_cost]
                )

    # 3. Backtrack through DP table from cell (n, W) to reconstruct optimal items
    selected_items: List[Item] = []
    selected_ids = set()
    current_w = W

    for i in range(n, 0, -1):
        # If value changed from row above, item i was selected
        if dp[i][current_w] != dp[i - 1][current_w]:
            chosen_item = items[i - 1]
            selected_items.append(chosen_item)
            selected_ids.add(chosen_item.id)
            current_w -= chosen_item.cost

        if current_w <= 0:
            break

    # Reverse to restore natural original order
    selected_items.reverse()

    total_cost = sum(item.cost for item in selected_items)
    total_value = sum(item.value for item in selected_items)
    remaining_budget = W - total_cost

    # 4. Identify excluded items with clear explanations
    excluded_items: List[ExcludedItem] = []
    for item in items:
        if item.id not in selected_ids:
            if item.cost > W:
                reason = f"Item cost (₹{item.cost:,}) exceeds total available budget (₹{W:,})."
            elif item.cost > remaining_budget:
                reason = (
                    f"Item requires ₹{item.cost:,}, but surplus funds after selecting higher-utility items is only ₹{remaining_budget:,}."
                )
            else:
                reason = "Excluded in favor of an alternate combination that yields higher overall utility score."

            excluded_items.append(
                ExcludedItem(
                    id=item.id,
                    name=item.name,
                    cost=item.cost,
                    value=item.value,
                    reason=reason,
                )
            )

    duration_ms = (time.perf_counter() - start_time) * 1000.0

    return OptimizationResult(
        selected_items=selected_items,
        excluded_items=excluded_items,
        total_cost=total_cost,
        total_value=total_value,
        remaining_budget=remaining_budget,
        budget_capacity=W,
        item_count=n,
        execution_time_ms=round(duration_ms, 3),
    )
