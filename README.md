# SpendSmart — Smart Budget Optimizer with C++ Backend

A full-stack, genuine budgeting application combining a **C++ HTTP Backend** executing the **0/1 Knapsack Dynamic Programming algorithm** with a modern **React + TypeScript** frontend.

---

## 1. Architecture Overview

- **Backend (C++):**
  - Standalone HTTP server built using `cpp-httplib` and `nlohmann/json`.
  - Implements the exact 0/1 Knapsack Dynamic Programming recurrence relation with backtracking reconstruction.
  - Serves RESTful endpoints:
    - `GET /api/health` — Returns server status, version, and engine identification.
    - `POST /api/optimize` — Accepts budget capacity and candidate items, runs the $O(n \cdot W)$ DP algorithm, and returns the mathematically optimal subset, total value score, total cost, remaining budget, and itemized exclusion reasons.
  - Configured with CORS for frontend connectivity.
  - Runs on port `5000` (configurable via CLI argument or `PORT` environment variable).

- **Frontend (React + TypeScript):**
  - Communicates with the C++ backend over real HTTP requests.
  - Validates budget inputs and purchase items.
  - Displays remaining budget after deducting already-purchased expenses.
  - Marks recommendations as outdated whenever budget or items change.
  - Connects to the C++ backend via Vite's proxy (`/api` -> `http://127.0.0.1:5000`).

---

## 2. Dynamic Programming Algorithm (C++)

Implemented in `backend/knapsack.hpp`.

### State Formulation
Let $DP[i][w]$ be the maximum total priority score achievable considering the first $i$ candidate items within integer budget capacity $w$ ($0 \le w \le W$).

### Recurrence Relation
```cpp
// Base cases
DP[0][w] = 0   (for all w ∈ [0, W])
DP[i][0] = 0   (for all i ∈ [0, n])

// State transition
for (int i = 1; i <= n; ++i) {
    for (int w = 0; w <= W; ++w) {
        if (cost[i] > w) {
            DP[i][w] = DP[i - 1][w];
        } else {
            DP[i][w] = std::max(
                DP[i - 1][w],
                value[i] + DP[i - 1][w - cost[i]]
            );
        }
    }
}
```

### Backtracking Reconstruction
Starting from cell $(n, W)$:
- If $DP[i][w] \ne DP[i - 1][w]$, item $i$ was included. The server appends item $i$ to the selection list, deducts its cost ($w \leftarrow w - \text{cost}[i]$), and moves to row $i - 1$.
- If $DP[i][w] = DP[i - 1][w]$, item $i$ was not included, and the server moves to row $i - 1$.

### Complexity
- **Time Complexity:** $O(n \cdot W)$ — Instantaneous for personal budgeting ($\approx 0.02$ ms).
- **Space Complexity:** $O(n \cdot W)$ — 2D matrix of size $(n + 1) \times (W + 1)$ for full item reconstruction.
- **Safety Limit:** Budget is capped at ₹25,000 to prevent unbounded memory allocation.

---

## 3. How to Run on Windows

You will run the project using **two command prompt terminals**:

### Terminal 1: Compile and Start the C++ Backend

#### Option A: Using the Automated Scripts
Double-click or run:
```cmd
cd backend
run.bat
```
`run.bat` automatically checks for a compiler (`g++` via MinGW or `cl.exe` via Visual Studio MSVC), builds `spendsmart_server.exe` if not already present, and starts the server on port `5000`.

#### Option B: Manual Compilation with MinGW (g++)
```cmd
cd backend
g++ -std=c++17 -O2 main.cpp -o spendsmart_server.exe -lws2_32
spendsmart_server.exe 5000
```

#### Option C: Manual Compilation with Microsoft Visual C++ (MSVC)
Open **Developer Command Prompt for VS**:
```cmd
cd backend
cl /std:c++17 /O2 /EHsc /utf-8 /I. main.cpp /Fe:spendsmart_server.exe ws2_32.lib
spendsmart_server.exe 5000
```

You should see:
```
========================================================
 SpendSmart C++ 0/1 Knapsack Server started on port 5000
 Health: http://localhost:5000/api/health
 Optimize: POST http://localhost:5000/api/optimize
========================================================
```

---

### Terminal 2: Start the React Frontend

In the root project folder:
```cmd
npm install
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```
The React frontend will automatically connect to the C++ backend through Vite's local proxy.

---

## 4. How to Run on Linux / macOS

### Terminal 1: C++ Backend
```bash
cd backend
./build.sh
./run.sh
```

### Terminal 2: React Frontend
```bash
npm install
npm run dev
```

---

## 5. API Endpoints

### `GET /api/health`
Checks server status.
```bash
curl http://localhost:5000/api/health
```
**Response:**
```json
{
  "status": "ok",
  "service": "SpendSmart C++ Backend",
  "algorithm": "0/1 Knapsack Dynamic Programming",
  "version": "1.0.0"
}
```

### `POST /api/optimize`
Runs the 0/1 Knapsack optimization algorithm.
```bash
curl -X POST http://localhost:5000/api/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "budget": 500,
    "items": [
      {"id": "1", "name": "Headphones", "cost": 300, "value": 8},
      {"id": "2", "name": "Backpack", "cost": 250, "value": 6},
      {"id": "3", "name": "Power Bank", "cost": 250, "value": 6}
    ]
  }'
```
**Response:**
```json
{
  "backend": "C++ 0/1 Knapsack Dynamic Programming Engine",
  "budgetCapacity": 500,
  "executionTimeMs": 0.024,
  "itemCount": 3,
  "totalCost": 500,
  "totalValue": 12,
  "remainingBudget": 0,
  "selectedIds": ["2", "3"],
  "selectedItems": [
    {"cost": 250, "id": "2", "name": "Backpack", "value": 6},
    {"cost": 250, "id": "3", "name": "Power Bank", "value": 6}
  ],
  "excludedIds": ["1"],
  "excludedItems": [
    {
      "cost": 300,
      "id": "1",
      "name": "Headphones",
      "value": 8,
      "reason": "Item requires ₹300, but remaining surplus after selecting higher-utility items is only ₹0."
    }
  ]
}
```

---

## 6. Project Directory Layout

```
├── index.html                   # Entry HTML
├── package.json                 # React dependencies and scripts
├── vite.config.ts               # Vite configuration with /api proxy to C++ backend
├── backend/                     # Dedicated C++ HTTP Server
│   ├── main.cpp                 # Server entry point, routing, and CORS handling
│   ├── knapsack.hpp             # 0/1 Knapsack DP algorithm, validation, & backtracking
│   ├── include/
│   │   ├── httplib.h            # Single-header HTTP library (cpp-httplib)
│   │   └── json.hpp             # Modern C++ JSON library (nlohmann/json)
│   ├── build.bat                # Windows build script (MinGW/MSVC)
│   ├── run.bat                  # Windows launch script
│   ├── build.sh                 # Linux/macOS build script
│   └── run.sh                   # Linux/macOS launch script
└── src/
    ├── App.tsx                  # Main single-page UI orchestrator
    ├── types.ts                 # TypeScript interfaces (budgets, items, backend responses)
    ├── services/
    │   └── api.ts               # Fetch client for C++ backend endpoints
    ├── data/
    │   └── presets.ts           # Sample presets
    └── components/
        ├── BudgetSection.tsx    # Budget configuration and summary
        ├── AddItemSection.tsx   # Item addition form with validation
        ├── ExpenseListSection.tsx# Interactive list with "Mark as purchased"
        └── OptimizationSection.tsx# Backend trigger, results breakdown, & DP explainer
```
