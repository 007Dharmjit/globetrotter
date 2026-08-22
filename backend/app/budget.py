"""Cost maths for a trip. Everything is worked out here so the client never sends totals."""

from datetime import timedelta
from decimal import Decimal


def nights(stop) -> int:
    return (stop.departure_date - stop.arrival_date).days


def activity_cost(planned) -> Decimal:
    return Decimal(planned.cost_override if planned.cost_override is not None else planned.activity.cost)


def stop_cost(stop) -> dict:
    stay = (
        Decimal(stop.stay_cost_override)
        if stop.stay_cost_override is not None
        else Decimal(stop.city.avg_stay_cost_per_day) * nights(stop)
    )
    # You eat on the day you arrive and on the day you leave, hence nights + 1.
    meals = Decimal(stop.city.avg_meal_cost_per_day) * (nights(stop) + 1)
    transport = Decimal(stop.transport_cost)
    activities = sum((activity_cost(planned) for planned in stop.activities), Decimal("0"))

    return {
        "stay": stay,
        "meals": meals,
        "transport": transport,
        "activities": activities,
        "total": stay + meals + transport + activities,
    }


def trip_budget(trip) -> dict:
    """Full breakdown for one trip: totals, per category, per stop and per day."""
    trip_days = (trip.end_date - trip.start_date).days + 1
    by_category = {"transport": Decimal("0"), "stay": Decimal("0"), "activities": Decimal("0"), "meals": Decimal("0")}
    per_day = {trip.start_date + timedelta(days=offset): Decimal("0") for offset in range(trip_days)}
    by_stop = []

    def charge(day, amount):
        if day in per_day:
            per_day[day] += amount

    for stop in sorted(trip.stops, key=lambda s: s.order_index):
        costs = stop_cost(stop)
        for key in by_category:
            by_category[key] += costs[key]

        by_stop.append(
            {
                "stop_id": stop.id,
                "city": stop.city.name,
                "country": stop.city.country,
                "nights": nights(stop),
                "transport": costs["transport"],
                "stay": costs["stay"],
                "meals": costs["meals"],
                "activities": costs["activities"],
                "total": costs["total"],
            }
        )

        charge(stop.arrival_date, costs["transport"])

        stayed = nights(stop)
        if stayed:
            per_night = costs["stay"] / stayed
            for offset in range(stayed):
                charge(stop.arrival_date + timedelta(days=offset), per_night)
        else:
            charge(stop.arrival_date, costs["stay"])

        meal_rate = Decimal(stop.city.avg_meal_cost_per_day)
        for offset in range(stayed + 1):
            charge(stop.arrival_date + timedelta(days=offset), meal_rate)

        for planned in stop.activities:
            charge(planned.scheduled_date, activity_cost(planned))

    total = sum(by_category.values(), Decimal("0"))
    daily_limit = Decimal(trip.total_budget) / trip_days if trip.total_budget else None

    return {
        "total": total,
        "total_budget": Decimal(trip.total_budget) if trip.total_budget else None,
        "by_category": by_category,
        "by_stop": by_stop,
        "by_day": [
            {
                "date": day,
                "cost": cost,
                "over_budget": daily_limit is not None and cost > daily_limit,
            }
            for day, cost in sorted(per_day.items())
        ],
        "avg_per_day": total / trip_days,
        "daily_limit": daily_limit,
        "trip_days": trip_days,
        "over_budget": daily_limit is not None and total > Decimal(trip.total_budget),
    }
