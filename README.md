# SpendSmart — Smart Budget Optimizer (Python & Streamlit)

A 3rd-Year B.Tech Data Structures and Algorithms (DAA) Mini-Project implementing the **0/1 Knapsack Dynamic Programming Algorithm** entirely in **Python** with an interactive **Streamlit** user interface.

No separate servers, compilation, C++, or Node.js are required. The complete application runs with a single command.

---

## 1. Project Overview & DAA Concept

SpendSmart models personal financial budgeting as a classic **0/1 Knapsack Problem**:
- **Knapsack Capacity ($W$):** Available budget in integer Indian Rupees ($W = \text{Total Budget} - \text{Purchased Spending}$).
- **Candidate Items ($n$):** Unpurchased planned expenses entered by the user.
- **Item Weight ($w_i$):** Estimated cost in rupees ($\text{cost}[i]$).
- **Item Value ($v_i$):** User utility or priority score from 1 to 10 ($\text{value}[i]$).
- **Decision:** $x_i \in \{0, 1\}$. Each planned item is either included completely ($x_i = 1$) or excluded ($x_i = 0$).

### Dynamic Programming Recurrence
Implemented in `optimizer.py`:

$$\text{Base Cases: } DP[0][w] = 0, \quad DP[i][0] = 0$$

$$\text{If } \text{cost}[i] > w: \quad DP[i][w] = DP[i-1][w]$$

$$\text{Otherwise: } DP[i][w] = \max\Big(DP[i-1][w],\; \text{value}[i] + DP[i-1][w - \text{cost}[i]]\Big)$$

### Backtracking Recovery
Starting from cell $(n, W)$ down to $(1, 0)$:
- If $DP[i][w] \ne DP[i-1][w]$, item $i$ was chosen. Its cost is subtracted ($w \leftarrow w - \text{cost}[i]$), and backtracking continues to row $i-1$.
- If $DP[i][w] = DP[i-1][w]$, item $i$ was not included, and backtracking moves to row $i-1$.

### Complexity
- **Time Complexity:** $O(n \cdot W)$ — Instantaneous execution for personal budgeting ranges.
- **Space Complexity:** $O(n \cdot W)$ — Table of size $(n + 1) \times (W + 1)$ to allow exact item set reconstruction.
- **Memory Safety:** Budget input is bounded to ₹25,000 to prevent unbounded memory allocation.

---

## 2. Why Greedy Fails (Classic Viva Question)

A greedy algorithm sorting by value-to-cost ratio ($v_i / w_i$) or highest score first fails in 0/1 Knapsack because items are indivisible:

### Counterexample:
- **Budget Capacity ($W$):** ₹500
- **Item A:** Cost ₹300, Value 8 (Ratio = $8/300 = 0.0267$)
- **Item B:** Cost ₹250, Value 6 (Ratio = $6/250 = 0.0240$)
- **Item C:** Cost ₹250, Value 6 (Ratio = $6/250 = 0.0240$)

- **Greedy Outcome:** Takes Item A (highest ratio). Remaining budget = ₹200. Neither Item B nor Item C fits.  
  $\to$ **Total Value = 8** (Cost = ₹300).
- **Dynamic Programming Outcome:** Considers combinatorial subproblems and selects **Item B + Item C** ($250 + 250 = ₹500$).  
  $\to$ **Total Value = 12** (Cost = ₹500).
- **Viva Conclusion:** DP produces $+4$ higher utility than greedy for the exact same budget constraint!

---

## 3. How to Run Locally on Windows

Run the entire application in your command prompt using the following commands:

```cmd
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
streamlit run app.py
```

The application will automatically open in your default browser at:
```
http://localhost:8501
```

Both the user interface and the 0/1 Knapsack optimization logic run entirely through this single Streamlit application. No second terminal, compilation, or backend server is needed.

---

## 4. How to Run on macOS / Linux

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
streamlit run app.py
```

---

## 5. Application Features & Rules

1. **Section A — Budget Overview:**
   - Configure total budget in Indian Rupees (₹).
   - Real-time display of **Total Budget**, **Purchased Spending**, and **Remaining Available Budget**.
   - Input validation prevents negative values and rejects lowering the budget below already-purchased expenses.

2. **Section B — Add an Expense:**
   - Enter Item Name, Cost (₹), and Priority Score (1 to 10).
   - Strict validation: Rejects blank names, non-positive costs, or scores outside 1–10.

3. **Section C — Spending Item List:**
   - Displays real user-entered items with cost and priority ratings.
   - **"Done" (Mark as purchased):** Deducts item cost from available budget and excludes it from future optimization.
   - **"Undo":** Restores purchased item back to planned status.
   - **"Remove":** Deletes item from list.
   - Any list change flags previous optimization results as outdated.

4. **Section D — Optimize My Budget:**
   - Click **"Find My Best Spending Plan"** to execute `solve_knapsack` in `optimizer.py`.
   - Displays recommended combination, total recommended cost, combined utility score, remaining surplus budget, and execution duration.
   - Detailed list of unselected items with individual reasons.

5. **Section E — Algorithm Explanation:**
   - Expandable DAA mini-project and viva study guide with problem formulation, recurrence relation, backtracking steps, complexity analysis, and greedy counterexample.

6. **Local Persistence:**
   - Budget and item lists are saved automatically to `spendsmart_data.json` to survive application restarts.

---

## 6. Project Structure

```
spendsmart/
├── app.py               # Streamlit user interface & state management
├── optimizer.py         # 0/1 Knapsack Dynamic Programming algorithm
├── requirements.txt     # Python dependencies (Streamlit)
├── README.md            # Documentation and setup instructions
└── spendsmart_data.json # Local persistence file (auto-generated)
```
