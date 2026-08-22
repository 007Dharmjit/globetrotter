"""Cost maths for a trip. Everything is worked out here so the client never sends totals."""

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
