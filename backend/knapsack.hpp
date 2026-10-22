#ifndef SPENDSMART_KNAPSACK_HPP
#define SPENDSMART_KNAPSACK_HPP

#include <string>
#include <vector>
#include <algorithm>
#include <chrono>
#include <stdexcept>
#include <unordered_set>
#include "include/json.hpp"

namespace spendsmart {

// Sensible upper limit to prevent excessive memory usage in O(n * W) DP table
constexpr int MAX_SAFE_BUDGET = 25000;

struct Item {
    std::string id;
    std::string name;
    int cost = 0;
    int value = 0; // Priority rating from 1 to 10
};

struct ExcludedItem {
    std::string id;
    std::string name;
    int cost = 0;
    int value = 0;
    std::string reason;
};

struct OptimizationResult {
    std::vector<std::string> selectedIds;
    std::vector<std::string> excludedIds;
    std::vector<Item> selectedItems;
    std::vector<ExcludedItem> excludedItems;
    int totalCost = 0;
    int totalValue = 0;
    int remainingBudget = 0;
    int budgetCapacity = 0;
    int itemCount = 0;
    double executionTimeMs = 0.0;
};

/**
 * Validates input parameters for the optimization.
 */
inline void validateInput(int budget, const std::vector<Item>& items) {
    if (budget < 0) {
        throw std::invalid_argument("Budget cannot be negative.");
    }
    if (budget > MAX_SAFE_BUDGET) {
        throw std::invalid_argument("Budget exceeds the maximum safe limit of ₹" + 
                                   std::to_string(MAX_SAFE_BUDGET) + 
                                   " to prevent excessive O(nW) memory usage.");
    }
    for (size_t i = 0; i < items.size(); ++i) {
        const auto& item = items[i];
        if (item.id.empty()) {
            throw std::invalid_argument("Item at index " + std::to_string(i) + " is missing an id.");
        }
        if (item.name.empty()) {
            throw std::invalid_argument("Item '" + item.id + "' cannot have an empty name.");
        }
        if (item.cost <= 0) {
            throw std::invalid_argument("Item '" + item.name + "' has invalid cost (must be > 0).");
        }
        if (item.value < 1 || item.value > 10) {
            throw std::invalid_argument("Item '" + item.name + "' has invalid value (must be between 1 and 10).");
        }
    }
}

/**
 * 0/1 Knapsack Dynamic Programming Algorithm
 * 
 * Given:
 *   n candidate unpurchased items
 *   W = available budget capacity in integer rupees
 * 
 * Recurrence:
 *   DP[i][w] = DP[i-1][w]                                    if cost[i] > w
 *   DP[i][w] = max(DP[i-1][w], value[i] + DP[i-1][w-cost[i]]) otherwise
 * 
 * Complexity:
 *   Time:  O(n * W)
 *   Space: O(n * W)
 */
inline OptimizationResult solveKnapsack(int budget, const std::vector<Item>& items) {
    auto startTime = std::chrono::high_resolution_clock::now();

    validateInput(budget, items);

    OptimizationResult result;
    result.budgetCapacity = budget;
    result.itemCount = static_cast<int>(items.size());

    // Edge case: No items or zero budget
    if (items.empty() || budget == 0) {
        result.remainingBudget = budget;
        for (const auto& item : items) {
            result.excludedIds.push_back(item.id);
            result.excludedItems.push_back({
                item.id,
                item.name,
                item.cost,
                item.value,
                budget == 0 ? "Budget capacity is ₹0." : "No budget remaining."
            });
        }
        auto endTime = std::chrono::high_resolution_clock::now();
        result.executionTimeMs = std::chrono::duration<double, std::milli>(endTime - startTime).count();
        return result;
    }

    const int n = static_cast<int>(items.size());
    const int W = budget;

    // 1. Initialize DP Table with zeros: (n + 1) rows x (W + 1) columns
    // DP[i][w] represents max total value obtainable using first i items within budget w
    std::vector<std::vector<int>> DP(n + 1, std::vector<int>(W + 1, 0));

    // 2. Iteratively fill the DP table
    for (int i = 1; i <= n; ++i) {
        const int itemCost = items[i - 1].cost;
        const int itemValue = items[i - 1].value;

        for (int w = 0; w <= W; ++w) {
            if (itemCost > w) {
                // Item i cannot fit in capacity w
                DP[i][w] = DP[i - 1][w];
            } else {
                // Decide whether taking item i yields greater total value
                DP[i][w] = std::max(
                    DP[i - 1][w],
                    itemValue + DP[i - 1][w - itemCost]
                );
            }
        }
    }

    // 3. Backtrack through the DP table to reconstruct the optimal set of items
    std::vector<Item> selected;
    std::unordered_set<std::string> selectedIdSet;
    int remainingW = W;

    for (int i = n; i > 0; --i) {
        // If the value changed from the row above, item i was included
        if (DP[i][remainingW] != DP[i - 1][remainingW]) {
            const auto& chosen = items[i - 1];
            selected.push_back(chosen);
            selectedIdSet.insert(chosen.id);
            remainingW -= chosen.cost;
        }
        if (remainingW <= 0) break;
    }

    // Reverse to preserve natural original order
    std::reverse(selected.begin(), selected.end());

    result.selectedItems = selected;
    for (const auto& item : selected) {
        result.selectedIds.push_back(item.id);
        result.totalCost += item.cost;
        result.totalValue += item.value;
    }

    result.remainingBudget = W - result.totalCost;

    // 4. Identify excluded items with clear explanations
    for (const auto& item : items) {
        if (selectedIdSet.find(item.id) == selectedIdSet.end()) {
            result.excludedIds.push_back(item.id);
            std::string reason;
            if (item.cost > W) {
                reason = "Item cost (₹" + std::to_string(item.cost) + 
                         ") exceeds total available budget (₹" + std::to_string(W) + ").";
            } else if (item.cost > result.remainingBudget) {
                reason = "Item requires ₹" + std::to_string(item.cost) + 
                         ", but remaining surplus after selecting higher-utility items is only ₹" + 
                         std::to_string(result.remainingBudget) + ".";
            } else {
                reason = "Excluded in favor of an alternate combination that maximizes overall utility score.";
            }
            result.excludedItems.push_back({
                item.id,
                item.name,
                item.cost,
                item.value,
                reason
            });
        }
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    result.executionTimeMs = std::chrono::duration<double, std::milli>(endTime - startTime).count();

    return result;
}

// Convert OptimizationResult to JSON
inline nlohmann::json toJson(const OptimizationResult& res) {
    nlohmann::json j;
    j["selectedIds"] = res.selectedIds;
    j["excludedIds"] = res.excludedIds;

    j["selectedItems"] = nlohmann::json::array();
    for (const auto& item : res.selectedItems) {
        j["selectedItems"].push_back({
            {"id", item.id},
            {"name", item.name},
            {"cost", item.cost},
            {"value", item.value}
        });
    }

    j["excludedItems"] = nlohmann::json::array();
    for (const auto& item : res.excludedItems) {
        j["excludedItems"].push_back({
            {"id", item.id},
            {"name", item.name},
            {"cost", item.cost},
            {"value", item.value},
            {"reason", item.reason}
        });
    }

    j["totalCost"] = res.totalCost;
    j["totalValue"] = res.totalValue;
    j["remainingBudget"] = res.remainingBudget;
    j["budgetCapacity"] = res.budgetCapacity;
    j["itemCount"] = res.itemCount;
    j["executionTimeMs"] = res.executionTimeMs;
    j["backend"] = "C++ 0/1 Knapsack Dynamic Programming Engine";

    return j;
}

} // namespace spendsmart

#endif // SPENDSMART_KNAPSACK_HPP
