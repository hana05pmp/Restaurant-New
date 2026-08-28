from fastapi import APIRouter
from database import db
from datetime import datetime, timedelta
from collections import defaultdict

router = APIRouter()


def _branch_filter(branch_id: str):
    """Match both string and numeric branch identifiers used by the datasets."""
    values = [branch_id]
    if str(branch_id).isdigit():
        values.append(int(branch_id))

    return {
        "$or": [
            {"StoreNumber": value} for value in values
        ]
    }


def _to_float(value, default=0.0):
    try:
        return float(value or default)
    except (TypeError, ValueError):
        return default


def _order_detail_date(detail):
    """Return a datetime for an order_details document when possible."""
    value = detail.get("date") or detail.get("createdAt")

    if isinstance(value, datetime):
        return value

    if isinstance(value, str):
        for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"):
            try:
                return datetime.strptime(value[:19], fmt)
            except ValueError:
                continue

    return None


@router.get("/api/branch/sales-report/{branch_id}")
def sales_report(branch_id: str):
    """
    Branch sales report backed by MongoDB.

    order_details is the sales ledger: an entry is written when an order is
    confirmed. Using it as the canonical source prevents the same confirmed
    order from being counted twice (orders + order_details).
    """
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=6)

    details = list(db["order_details"].find(_branch_filter(branch_id)))

    today_sales = 0.0
    total_sales = 0.0
    total_orders = 0
    items_sold = 0
    top_menu = defaultdict(int)
    weekly = defaultdict(float)

    # Every order normally creates one detail per menu item. Count unique
    # OrderId values as orders, while summing every detail line for sales.
    order_ids = set()

    for detail in details:
        quantity = int(_to_float(detail.get("Quantity"), 0))
        price = _to_float(detail.get("Price"), 0)
        line_total = _to_float(detail.get("Total"), quantity * price)

        total_sales += line_total
        items_sold += quantity

        order_id = detail.get("OrderId")
        if order_id:
            order_ids.add(str(order_id))

        name = str(detail.get("Description") or "Unknown")
        top_menu[name] += quantity

        detail_date = _order_detail_date(detail)
        if detail_date:
            if detail_date >= today_start:
                today_sales += line_total

            if detail_date >= week_start:
                weekly[detail_date.strftime("%a")] += line_total

    # Legacy rows may not have OrderId. In that case count each sales line as
    # an order so the report still returns useful values for old data.
    rows_with_order_id = sum(1 for d in details if d.get("OrderId"))
    rows_without_order_id = len(details) - rows_with_order_id
    total_orders = len(order_ids) + rows_without_order_id

    average_order = total_sales / total_orders if total_orders else 0.0

    weekly_sales = [
        {"day": day, "sales": round(weekly[day], 2)}
        for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    ]

    top_menus = [
        {"name": name, "quantity": quantity}
        for name, quantity in sorted(
            top_menu.items(), key=lambda item: item[1], reverse=True
        )[:10]
    ]

    return {
        "branchId": branch_id,
        "todaySales": round(today_sales, 2),
        "totalSales": round(total_sales, 2),
        "totalOrders": total_orders,
        "itemsSold": items_sold,
        "averageOrderValue": round(average_order, 2),
        "weeklySales": weekly_sales,
        "topMenus": top_menus,
    }
