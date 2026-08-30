from fastapi import APIRouter
from database import db
from datetime import datetime, timedelta
from collections import defaultdict

router = APIRouter()


def _branch_values(branch_id: str):
    values = [str(branch_id)]
    if str(branch_id).isdigit():
        values.append(int(branch_id))
    return values


def _order_branch_filter(branch_id: str):
    return {
        "$or": [
            {"branchId": value} for value in _branch_values(branch_id)
        ] + [
            {"branch_id": value} for value in _branch_values(branch_id)
        ]
    }


def _detail_branch_filter(branch_id: str):
    return {
        "$or": [
            {"StoreNumber": value} for value in _branch_values(branch_id)
        ]
    }


def _to_float(value, default=0.0):
    try:
        return float(value or default)
    except (TypeError, ValueError):
        return default


def _parse_date(value):
    if isinstance(value, datetime):
        return value

    if not value:
        return None

    text = str(value)
    for fmt in (
        "%Y-%m-%d",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
    ):
        try:
            return datetime.strptime(text[:19], fmt)
        except ValueError:
            continue

    return None


@router.get("/api/branch/sales-report/{branch_id}")
def sales_report(branch_id: str):
    """Return branch sales from both historical dataset data and live sales.

    Historical dataset data is stored as:
      orders      -> order_id, branch_id, order_date, total_amount
      order_items -> order_id, menu_id, quantity, unit_price, subtotal

    New customer orders are stored as `orders` documents and create
    `order_details` when the branch manager confirms them.
    """
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    current_week_start = today_start - timedelta(days=6)

    # ---------------------------------------------------------
    # 1. Historical dataset orders
    # ---------------------------------------------------------
    dataset_orders = list(db["orders"].find({
        "$and": [
            _order_branch_filter(branch_id),
            {"order_id": {"$exists": True}},
        ]
    }))

    dataset_order_ids = [str(order.get("order_id")) for order in dataset_orders if order.get("order_id")]
    dataset_order_id_set = set(dataset_order_ids)

    dataset_items = list(db["order_items"].find({
        "order_id": {"$in": dataset_order_ids}
    })) if dataset_order_ids else []

    # Menu lookup for top-selling names.
    menu_ids = list({item.get("menu_id") for item in dataset_items if item.get("menu_id") is not None})
    menu_docs = list(db["menu_items"].find({
        "$or": [
            {"menu_id": {"$in": menu_ids}},
            {"MenuItemId": {"$in": menu_ids}},
        ]
    })) if menu_ids else []

    menu_names = {}
    for menu in menu_docs:
        key = menu.get("menu_id")
        if key is not None:
            menu_names[str(key)] = menu.get("menu_name") or menu.get("Description") or str(key)
        key = menu.get("MenuItemId")
        if key is not None:
            menu_names[str(key)] = menu.get("menu_name") or menu.get("Description") or str(key)

    total_sales = 0.0
    today_sales = 0.0
    items_sold = 0
    top_menu = defaultdict(int)
    weekly = defaultdict(float)
    dataset_dates = []

    # Use the order header's total_amount as the canonical historical sale.
    # This avoids double-counting an order that contains several item rows.
    for order in dataset_orders:
        amount = _to_float(order.get("total_amount"))
        total_sales += amount

        order_date = _parse_date(order.get("order_date"))
        if order_date:
            dataset_dates.append(order_date)
            if order_date >= today_start:
                today_sales += amount
            if order_date >= current_week_start:
                weekly[order_date.strftime("%a")] += amount

    # Quantities/top menus come from order_items.
    for item in dataset_items:
        try:
            quantity = int(float(item.get("quantity", 0) or 0))
        except (TypeError, ValueError):
            quantity = 0

        items_sold += quantity
        name = menu_names.get(str(item.get("menu_id")), f"Menu {item.get('menu_id', 'Unknown')}")
        top_menu[name] += quantity

    # ---------------------------------------------------------
    # 2. New/live confirmed sales
    # ---------------------------------------------------------
    details = list(db["order_details"].find(_detail_branch_filter(branch_id)))
    live_order_ids = set()

    for detail in details:
        line_total = _to_float(
            detail.get("Total"),
            _to_float(detail.get("Quantity"), 0) * _to_float(detail.get("Price"), 0),
        )
        total_sales += line_total

        try:
            items_sold += int(float(detail.get("Quantity", 0) or 0))
        except (TypeError, ValueError):
            pass

        order_id = detail.get("OrderId")
        if order_id:
            live_order_ids.add(str(order_id))

        name = str(detail.get("Description") or "Unknown")
        top_menu[name] += int(_to_float(detail.get("Quantity"), 0))

        detail_date = _parse_date(detail.get("date") or detail.get("createdAt"))
        if detail_date:
            if detail_date >= today_start:
                today_sales += line_total
            if detail_date >= current_week_start:
                weekly[detail_date.strftime("%a")] += line_total

    total_orders = len(dataset_order_id_set) + len(live_order_ids - dataset_order_id_set)
    average_order = total_sales / total_orders if total_orders else 0.0

    # ---------------------------------------------------------
    # Weekly chart
    # ---------------------------------------------------------
    week_days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    # If the current week has no sales (which is expected for a 2025 demo
    # dataset while the app is running in 2026), show the latest 7-day period
    # present in the historical dataset instead of an empty chart.
    if not any(weekly.values()) and dataset_dates:
        latest_start = max(dataset_dates).replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=6)
        weekly = defaultdict(float)

        for order in dataset_orders:
            order_date = _parse_date(order.get("order_date"))
            if order_date and order_date >= latest_start:
                weekly[order_date.strftime("%a")] += _to_float(order.get("total_amount"))

        for detail in details:
            detail_date = _parse_date(detail.get("date") or detail.get("createdAt"))
            if detail_date and detail_date >= latest_start:
                line_total = _to_float(
                    detail.get("Total"),
                    _to_float(detail.get("Quantity"), 0) * _to_float(detail.get("Price"), 0),
                )
                weekly[detail_date.strftime("%a")] += line_total

    weekly_sales = [
        {"day": day, "sales": round(weekly[day], 2)}
        for day in week_days
    ]

    top_menus = [
        {"name": name, "quantity": quantity}
        for name, quantity in sorted(
            top_menu.items(), key=lambda item: item[1], reverse=True
        )[:10]
    ]

    return {
        "branchId": str(branch_id),
        "todaySales": round(today_sales, 2),
        "totalSales": round(total_sales, 2),
        "totalOrders": total_orders,
        "itemsSold": items_sold,
        "averageOrderValue": round(average_order, 2),
        "weeklySales": weekly_sales,
        "topMenus": top_menus,
    }
