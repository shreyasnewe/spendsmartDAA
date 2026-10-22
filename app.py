"""
SpendSmart — Smart Budget Optimizer
Implementation of the 0/1 Knapsack Dynamic Programming algorithm in Python & Streamlit.
"""

import json
import os
import uuid
import streamlit as st
from optimizer import Item, solve_knapsack, MAX_SAFE_BUDGET, OptimizationResult

# Local persistence file
DATA_FILE = "spendsmart_data.json"


# -----------------------------------------------------------------------------
# Data Persistence Utilities
# -----------------------------------------------------------------------------
def load_persisted_data():
    """Safely loads budget and items from spendsmart_data.json if present."""
    default_data = {
        "total_budget": 1000,
        "items": []
    }
    if not os.path.exists(DATA_FILE):
        return default_data

    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if not isinstance(data, dict):
                return default_data

            budget = data.get("total_budget", 1000)
            raw_items = data.get("items", [])

            # Sanitize loaded values
            if not isinstance(budget, int) or budget < 0:
                budget = 1000

            valid_items = []
            if isinstance(raw_items, list):
                for item in raw_items:
                    if (
                        isinstance(item, dict)
                        and "id" in item
                        and "name" in item
                        and "cost" in item
                        and "value" in item
                    ):
                        valid_items.append({
                            "id": str(item["id"]),
                            "name": str(item["name"]),
                            "cost": int(item["cost"]),
                            "value": int(item["value"]),
                            "is_purchased": bool(item.get("is_purchased", False)),
                        })

            return {"total_budget": budget, "items": valid_items}
    except Exception:
        return default_data


def save_persisted_data(budget: int, items_list: list):
    """Saves current budget and items state to spendsmart_data.json."""
    try:
        data = {
            "total_budget": budget,
            "items": items_list,
        }
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        st.error(f"Error saving data locally: {e}")


# -----------------------------------------------------------------------------
# Page Configuration & Dark Styling
# -----------------------------------------------------------------------------
st.set_page_config(
    page_title="SpendSmart",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# Dark Theme CSS: Deep slate background, high-contrast readable typography, emerald accents
st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

    /* Hide the top Streamlit header bar completely */
    header[data-testid="stHeader"] {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
    }
    div[data-testid="stToolbar"] {
        display: none !important;
    }
    #MainMenu, footer {
        visibility: hidden !important;
    }

    /* Hide form submission instructions and character counters */
    div[data-testid="InputInstructions"],
    div[data-testid="stFieldInstructions"],
    div[data-testid="stTextInput"] small,
    div[data-testid="stNumberInput"] small,
    .st-emotion-cache-12w0qpk {
        display: none !important;
    }

    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .stApp {
        background-color: #0F172A;
        color: #F8FAFC;
    }

    /* Main Container max-width */
    .block-container {
        max-width: 960px;
        padding-top: 1.5rem;
        padding-bottom: 3.5rem;
    }

    /* Header styling */
    .spendsmart-header {
        border-bottom: 1px solid #334155;
        padding-bottom: 1rem;
        margin-bottom: 1.5rem;
    }
    .spendsmart-title {
        font-size: 2rem;
        font-weight: 700;
        color: #F8FAFC;
        letter-spacing: -0.02em;
        margin: 0;
    }

    .section-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #F8FAFC;
        margin-top: 0;
        margin-bottom: 1rem;
    }

    /* Metric cards in dark theme */
    .metric-box {
        background: #1E293B;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 0.85rem 1rem;
        text-align: center;
    }
    .metric-label {
        font-size: 0.72rem;
        font-weight: 600;
        color: #94A3B8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .metric-value {
        font-size: 1.35rem;
        font-weight: 700;
        color: #F8FAFC;
        margin-top: 0.2rem;
        font-family: 'JetBrains Mono', monospace;
    }
    .metric-value.highlight {
        color: #34D399;
    }
    .metric-value.spent {
        color: #F87171;
    }

    /* Buttons */
    .stButton>button {
        border-radius: 8px;
        font-weight: 600;
        transition: all 0.15s ease-in-out;
    }

    /* Badges */
    .badge-purchased {
        background-color: #450A0A;
        color: #FCA5A5;
        border: 1px solid #7F1D1D;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    .badge-planned {
        background-color: #1E1B4B;
        color: #A5B4FC;
        border: 1px solid #312E81;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    .badge-optimal {
        background-color: #064E3B;
        color: #6EE7B7;
        border: 1px solid #047857;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


# -----------------------------------------------------------------------------
# Initialize Session State
# -----------------------------------------------------------------------------
if "initialized" not in st.session_state:
    persisted = load_persisted_data()
    st.session_state.total_budget = persisted["total_budget"]
    st.session_state.budget_items = persisted["items"]
    st.session_state.optimization_result = None
    st.session_state.is_outdated = False
    st.session_state.status_message = None
    st.session_state.initialized = True


def mark_data_changed():
    """Triggered whenever budget or items change to update persistence and flag optimization."""
    save_persisted_data(st.session_state.total_budget, st.session_state.budget_items)
    if st.session_state.optimization_result is not None:
        st.session_state.is_outdated = True


# -----------------------------------------------------------------------------
# Financial Calculations
# -----------------------------------------------------------------------------
total_budget = st.session_state.total_budget
budget_items = st.session_state.budget_items

purchased_spending = sum(item["cost"] for item in budget_items if item["is_purchased"])
available_budget = max(0, total_budget - purchased_spending)
unpurchased_items = [item for item in budget_items if not item["is_purchased"]]
planned_total = sum(item["cost"] for item in unpurchased_items)


# -----------------------------------------------------------------------------
# App Header (Clean, minimal, no emojis, no subtitle)
# -----------------------------------------------------------------------------
st.markdown(
    """
    <div class="spendsmart-header">
        <h1 class="spendsmart-title">SpendSmart</h1>
    </div>
    """,
    unsafe_allow_html=True,
)

if st.session_state.status_message:
    st.info(st.session_state.status_message)
    st.session_state.status_message = None


# -----------------------------------------------------------------------------
# Budget Overview
# -----------------------------------------------------------------------------
st.markdown('<h2 class="section-title">Budget Overview</h2>', unsafe_allow_html=True)

col_input, col_kpi1, col_kpi2, col_kpi3 = st.columns([1.5, 1, 1, 1.2])

with col_input:
    new_budget = st.number_input(
        "Total Budget (INR)",
        min_value=0,
        max_value=MAX_SAFE_BUDGET,
        value=int(total_budget),
        step=50,
        help=f"Enter total budget in rupees (Max: INR {MAX_SAFE_BUDGET:,})",
        key="budget_input_field",
    )
    if new_budget != total_budget:
        if new_budget < purchased_spending:
            st.error(
                f"New budget (INR {new_budget:,}) cannot be less than already purchased expenses (INR {purchased_spending:,}). Unmark items first."
            )
        else:
            st.session_state.total_budget = int(new_budget)
            mark_data_changed()
            st.rerun()

with col_kpi1:
    st.markdown(
        f"""
        <div class="metric-box">
            <div class="metric-label">Total Budget</div>
            <div class="metric-value">INR {total_budget:,}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

with col_kpi2:
    st.markdown(
        f"""
        <div class="metric-box">
            <div class="metric-label">Purchased</div>
            <div class="metric-value spent">INR {purchased_spending:,}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

with col_kpi3:
    st.markdown(
        f"""
        <div class="metric-box">
            <div class="metric-label">Available Budget</div>
            <div class="metric-value highlight">INR {available_budget:,}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

st.markdown("<hr style='border: none; border-top: 1px solid #334155; margin: 1.5rem 0;'>", unsafe_allow_html=True)


# -----------------------------------------------------------------------------
# Add an Item
# -----------------------------------------------------------------------------
st.markdown('<h2 class="section-title">Add an Item</h2>', unsafe_allow_html=True)

col_name, col_cost, col_val, col_btn = st.columns([2.5, 1.2, 1.2, 1])

with col_name:
    item_name = st.text_input("Item Name", placeholder="Reference Textbook", key="input_item_name")
with col_cost:
    item_cost = st.number_input("Cost (INR)", min_value=1, max_value=MAX_SAFE_BUDGET, value=100, step=10, key="input_item_cost")
with col_val:
    item_value = st.number_input(
        "Value Score (1-10)",
        min_value=1,
        max_value=10,
        value=8,
        step=1,
        key="input_item_value",
        help="Assign priority or utility rating from 1 (low) to 10 (essential)",
    )
with col_btn:
    st.markdown("<div style='height: 28px;'></div>", unsafe_allow_html=True)
    add_submitted = st.button("Add Item", type="primary", use_container_width=True)

if add_submitted:
    clean_name = item_name.strip()
    if not clean_name:
        st.error("Please enter a valid, non-empty item name.")
    elif item_cost <= 0:
        st.error("Item cost must be a positive integer in rupees.")
    elif not (1 <= item_value <= 10):
        st.error("Item value score must be an integer between 1 and 10.")
    else:
        new_item = {
            "id": str(uuid.uuid4())[:8],
            "name": clean_name,
            "cost": int(item_cost),
            "value": int(item_value),
            "is_purchased": False,
        }
        st.session_state.budget_items.append(new_item)
        mark_data_changed()
        st.rerun()

st.markdown("<hr style='border: none; border-top: 1px solid #334155; margin: 1.5rem 0;'>", unsafe_allow_html=True)


# -----------------------------------------------------------------------------
# Item List
# -----------------------------------------------------------------------------
col_head, col_clear = st.columns([3, 1])
with col_head:
    st.markdown(
        f'<h2 class="section-title">Item List ({len(budget_items)} items · Planned: INR {planned_total:,})</h2>',
        unsafe_allow_html=True,
    )
with col_clear:
    if len(budget_items) > 0:
        if st.button("Clear All Items", key="btn_clear_all", help="Removes all items from the list"):
            st.session_state.budget_items = []
            st.session_state.optimization_result = None
            st.session_state.is_outdated = False
            mark_data_changed()
            st.rerun()

if not budget_items:
    st.info("No items added yet. Use the inputs above to add your planned purchases or expenses.")
else:
    for idx, item in enumerate(budget_items):
        item_id = item["id"]
        is_purchased = item["is_purchased"]

        with st.container():
            c1, c2, c3, c4, c5 = st.columns([2.8, 1.2, 1.2, 1.5, 1])

            with c1:
                if is_purchased:
                    st.markdown(f"<span style='color: #94A3B8; text-decoration: line-through;'>{item['name']}</span>", unsafe_allow_html=True)
                else:
                    st.markdown(f"**{item['name']}**")

            with c2:
                st.markdown(f"**INR {item['cost']:,}**")

            with c3:
                st.markdown(f"Priority: **{item['value']}/10**")

            with c4:
                if is_purchased:
                    st.markdown('<span class="badge-purchased">Purchased</span>', unsafe_allow_html=True)
                else:
                    st.markdown('<span class="badge-planned">Planned</span>', unsafe_allow_html=True)

            with c5:
                # Toggle Purchased / Undo Action
                action_label = "Undo" if is_purchased else "Mark Purchased"
                if st.button(action_label, key=f"toggle_{item_id}"):
                    item["is_purchased"] = not is_purchased
                    mark_data_changed()
                    st.rerun()

                # Remove item button
                if st.button("Remove", key=f"del_{item_id}"):
                    st.session_state.budget_items = [i for i in budget_items if i["id"] != item_id]
                    mark_data_changed()
                    st.rerun()

            st.markdown("<hr style='border: none; border-top: 1px solid #1E293B; margin: 0.4rem 0;'>", unsafe_allow_html=True)

st.markdown("<hr style='border: none; border-top: 1px solid #334155; margin: 1.5rem 0;'>", unsafe_allow_html=True)


# -----------------------------------------------------------------------------
# Optimize Budget (0/1 Knapsack Execution)
# -----------------------------------------------------------------------------
st.markdown('<h2 class="section-title">Optimize Budget</h2>', unsafe_allow_html=True)

# Outdated recommendation alert
if st.session_state.is_outdated and st.session_state.optimization_result is not None:
    st.warning("Your budget or items changed since the last optimization. Click 'Find My Best Spending Plan' to recalculate.")

col_opt_btn, col_opt_info = st.columns([1.5, 2])

with col_opt_btn:
    can_optimize = len(unpurchased_items) > 0 and available_budget > 0
    btn_optimize = st.button(
        "Find My Best Spending Plan",
        type="primary",
        disabled=not can_optimize,
        use_container_width=True,
    )

with col_opt_info:
    if not unpurchased_items:
        st.caption("Add at least one planned, unpurchased item to run the optimizer.")
    elif available_budget <= 0:
        st.caption("Available budget is INR 0. Increase your total budget to run optimization.")
    else:
        st.caption(f"Optimizing {len(unpurchased_items)} candidate items within capacity of INR {available_budget:,}.")

if btn_optimize and can_optimize:
    candidate_items = [
        Item(
            id=item["id"],
            name=item["name"],
            cost=int(item["cost"]),
            value=int(item["value"]),
        )
        for item in unpurchased_items
    ]

    try:
        # Execute the Python 0/1 Knapsack DP algorithm
        result: OptimizationResult = solve_knapsack(available_budget, candidate_items)
        st.session_state.optimization_result = result
        st.session_state.is_outdated = False
        st.rerun()
    except Exception as e:
        st.error(f"Optimization error: {e}")

# Render Optimization Results
res = st.session_state.optimization_result
if res is not None:
    st.markdown("### Optimal Spending Recommendation")

    # Metric Row
    r_col1, r_col2, r_col3, r_col4 = st.columns(4)
    with r_col1:
        st.markdown(
            f"""
            <div class="metric-box">
                <div class="metric-label">Recommended Cost</div>
                <div class="metric-value highlight">INR {res.total_cost:,}</div>
                <div style="font-size: 0.72rem; color: #94A3B8;">of INR {res.budget_capacity:,} capacity</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with r_col2:
        st.markdown(
            f"""
            <div class="metric-box">
                <div class="metric-label">Combined Value Score</div>
                <div class="metric-value">{res.total_value} pts</div>
                <div style="font-size: 0.72rem; color: #94A3B8;">Maximized utility</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with r_col3:
        st.markdown(
            f"""
            <div class="metric-box">
                <div class="metric-label">Remaining Surplus</div>
                <div class="metric-value">INR {res.remaining_budget:,}</div>
                <div style="font-size: 0.72rem; color: #94A3B8;">Unallocated funds</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with r_col4:
        st.markdown(
            f"""
            <div class="metric-box">
                <div class="metric-label">Selected Items</div>
                <div class="metric-value">{len(res.selected_items)} / {res.item_count}</div>
                <div style="font-size: 0.72rem; color: #94A3B8;">Solved in {res.execution_time_ms} ms</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("<div style='height: 12px;'></div>", unsafe_allow_html=True)

    # Selected Items
    st.markdown(f"#### Selected Items ({len(res.selected_items)})")
    if not res.selected_items:
        st.info("No items fit within the available budget. All individual item costs exceed the budget limit.")
    else:
        for item in res.selected_items:
            st.markdown(
                f"""
                <div style="background: rgba(6, 78, 59, 0.25); border: 1px solid rgba(5, 150, 105, 0.4); border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="color: #F8FAFC; font-size: 1rem;">{item.name}</strong>
                        <div style="font-size: 0.8rem; color: #6EE7B7; margin-top: 0.2rem;">
                            Cost: <strong>INR {item.cost:,}</strong> &nbsp;·&nbsp; Priority Value: <strong>{item.value}/10</strong>
                        </div>
                    </div>
                    <span class="badge-optimal">Recommended</span>
                </div>
                """,
                unsafe_allow_html=True,
            )

    # Excluded Items with Reasons
    if res.excluded_items:
        st.markdown(f"#### Excluded Items ({len(res.excluded_items)})")
        for item in res.excluded_items:
            st.markdown(
                f"""
                <div style="background: #1E293B; border: 1px solid #334155; border-radius: 8px; padding: 0.65rem 1rem; margin-bottom: 0.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: baseline;">
                        <strong style="color: #F8FAFC;">{item.name}</strong>
                        <span style="font-size: 0.8rem; color: #94A3B8;">INR {item.cost:,} · Value {item.value}/10</span>
                    </div>
                    <div style="font-size: 0.78rem; color: #94A3B8; margin-top: 0.2rem;">
                        <em>{item.reason}</em>
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )

st.markdown("<hr style='border: none; border-top: 1px solid #334155; margin: 1.5rem 0;'>", unsafe_allow_html=True)


# -----------------------------------------------------------------------------
# How the Algorithm Works
# -----------------------------------------------------------------------------
with st.expander("How the Algorithm Works", expanded=False):
    st.markdown(
        """
        ### 1. 0/1 Knapsack Problem Formulation
        Budgeting is modeled as the classical **0/1 Knapsack Problem**:
        - **Knapsack Capacity ($W$):** Available budget in integer rupees ($W = \\text{Total Budget} - \\text{Purchased Spending}$).
        - **Candidate Items ($n$):** Unpurchased planned expenses.
        - **Item Weight ($w_i$):** Estimated cost in rupees ($\text{cost}[i]$).
        - **Item Value ($v_i$):** Priority rating from 1 to 10 ($\text{value}[i]$).
        - **Decision Variable ($x_i$):** $x_i \\in \\{0, 1\\}$. An item can either be taken completely ($x_i = 1$) or not at all ($x_i = 0$).

        $$\\max \\sum_{i=1}^{n} v_i x_i \\quad \\text{subject to} \\quad \\sum_{i=1}^{n} w_i x_i \\le W$$

        ---

        ### 2. Why Dynamic Programming?
        The problem exhibits **Optimal Substructure** and **Overlapping Subproblems**:
        - The optimal choice for $i$ items at capacity $w$ depends on the optimal choices for $i-1$ items at smaller capacities.
        - Rather than evaluating all $2^n$ subsets exponentially, Dynamic Programming computes and caches solutions in an $(n+1) \\times (W+1)$ table.

        ---

        ### 3. Recurrence Relation
        Let $DP[i][w]$ denote the maximum utility achievable considering the first $i$ items within budget $w$:

        $$\\text{Base Cases: } DP[0][w] = 0, \\quad DP[i][0] = 0$$

        $$\\text{If } \\text{cost}[i] > w: \\quad DP[i][w] = DP[i-1][w]$$

        $$\\text{Otherwise: } DP[i][w] = \\max\\Big(DP[i-1][w],\\; \\text{value}[i] + DP[i-1][w - \\text{cost}[i]]\\Big)$$

        ---

        ### 4. Backtracking Reconstruction
        To identify which specific items were selected:
        1. Start from cell $DP[n][W]$.
        2. If $DP[i][w] \\ne DP[i-1][w]$, item $i$ was included. Subtract $\text{cost}[i]$ from $w$ and proceed to item $i-1$.
        3. If $DP[i][w] == DP[i-1][w]$, item $i$ was excluded. Move to item $i-1$.

        ---

        ### 5. Why Greedy Approach Fails
        A greedy strategy (such as picking items by highest value or highest $\\text{value}/\\text{cost}$ ratio) fails in 0/1 Knapsack because items are discrete and indivisible.

        **Counterexample:**
        - **Budget Capacity:** INR 500
        - **Item A:** Cost INR 300, Value 8 (Ratio = $8/300 = 0.0267$)
        - **Item B:** Cost INR 250, Value 6 (Ratio = $6/250 = 0.0240$)
        - **Item C:** Cost INR 250, Value 6 (Ratio = $6/250 = 0.0240$)

        - **Greedy Selection:** Takes Item A (highest ratio). Remaining budget = INR 200. Neither B nor C fits.  
          $\\to$ **Total Value = 8** (Cost = INR 300).
        - **Dynamic Programming Selection:** Explores subproblems and selects **Item B + Item C** ($250 + 250 = 500$).  
          $\\to$ **Total Value = 12** (Cost = INR 500).
        - **Result:** Dynamic Programming yields higher total utility than Greedy for the exact same budget constraint.

        ---

        ### 6. Time and Space Complexity
        - **Time Complexity:** $\\mathcal{O}(n \\cdot W)$ — filling $(n+1) \\times (W+1)$ cells in constant time each.
        - **Space Complexity:** $\\mathcal{O}(n \\cdot W)$ — storing the table for backtracking reconstruction.
        """
    )
