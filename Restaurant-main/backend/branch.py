@router.get("/api/branch/dashboard/{branch_id}")
def branch_dashboard(branch_id: str):

    return {
        "orders": 1248,
        "revenue": 24560,
        "customers": 865,
        "growth": 18,
        "salesTrend": [
            {
                "day":"Mon",
                "sales":400
            },
            {
                "day":"Tue",
                "sales":700
            },
            {
                "day":"Wed",
                "sales":500
            },
            {
                "day":"Thu",
                "sales":900
            },
            {
                "day":"Fri",
                "sales":1200
            }
        ]
    }