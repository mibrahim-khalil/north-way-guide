import os, random
import pandas as pd  # type: ignore

random.seed(42)

LABELS = [
    "PLAN_SKARDU_AIR",
    "PLAN_HUNZA_AIR",
    "PLAN_LOOP_KKH",
    "PLAN_SKARDU_KKH_SHORT",
    "PLAN_SKARDU_KKH_LONG",
    "PLAN_HUNZA_KKH_SHORT",
    "PLAN_HUNZA_KKH_LONG",
]

# Base public fares from Islamabad/Rawalpindi (per person, one-way)

PUBLIC_YUTONG_AC = {
    "SKARDU": (6500, 6500),
    "GILGIT": (6000, 6000),
    "GAHKUCH": (6000, 6000),
    "CHILAS": (4800, 4800),
    "HUNZA": (6200, 6200),
    "ASTORE": (6000, 6000),
    "BESHAM": (1800, 2200),
    "NARAN": (2300, 2800),
}

PUBLIC_COASTER = {
    "SKARDU": (3500, 4000),
    "GILGIT": (3200, 3500),
    "GAHKUCH": (3000, 3500),
    "CHILAS": (2300, 2600),
    "HUNZA": (3000, 3200),
    "ASTORE": (3500, 3700),
    "BESHAM": (1500, 2000),
    "NARAN": (2000, 2500),
}

# Rent-a-car fares from Islamabad/Rawalpindi (vehicle, one-way)

PRIVATE_CAR_ONEWAY = {
    "SKARDU": 30000,
    "GILGIT": 24000,
    "GAHKUCH": 28000,
    "CHILAS": 16000,
    "HUNZA": 28000,
    "ASTORE": 30000,
}

# Internal GB fares
# Shared seat fares (per person)
INTERNAL_SHARED_SEAT = {
    ("CHILAS", "RAIKOT"): (1500, 2500),
    ("CHILAS", "GILGIT"): (1000, 1500),
    ("JAGLOT", "GILGIT"): (500, 700),
    ("GILGIT", "HUNZA"): (500, 1000),
    ("GILGIT", "NAGAR"): (500, 1000),
    ("GILGIT", "SKARDU"): (1500, 2500),
    ("GILGIT", "ASTORE"): (1500, 2500),
    ("SKARDU", "SHIGAR"): (500, 700),
    ("SKARDU", "KHAPLU"): (1000, 1800),
    ("SKARDU", "KARMANG"): (1000, 2500),
    ("SKARDU", "ASTORE"): (4000, 5500),     # via Deosai
    ("GILGIT", "PHANDER"): (2000, 3500),
}

# Full car booking fares (vehicle)
INTERNAL_FULL_CAR = {
    ("CHILAS", "RAIKOT"): (17000, 25000),
    ("CHILAS", "GILGIT"): (12000, 17000),
    ("JAGLOT", "GILGIT"): (5000, 7000),
    ("GILGIT", "HUNZA"): (5500, 9000),
    ("GILGIT", "NAGAR"): (5500, 9000),
    ("GILGIT", "SKARDU"): (15000, 20000),
    ("GILGIT", "ASTORE"): (12000, 18000),
    ("SKARDU", "SHIGAR"): (5000, 6500),
    ("SKARDU", "KHAPLU"): (8000, 12000),
    ("SKARDU", "KARMANG"): (8000, 12000),
    ("SKARDU", "ASTORE"): (18000, 30000),   # via Deosai
    ("GILGIT", "PHANDER"): (20000, 35000),
}

# Hotel ranges per room per night (your table)

HOTEL_RANGES = {
    "GILGIT":   {"BUDGET": (2000, 5000), "MID": (6000, 12000), "LUX": (12000, 25000)},
    "HUNZA":    {"BUDGET": (2500, 6000), "MID": (8000, 18000), "LUX": (20000, 50000)},
    "SKARDU":   {"BUDGET": (2000, 5000), "MID": (7000, 15000), "LUX": (15000, 40000)},
    "GAHKUCH":  {"BUDGET": (1500, 4000), "MID": (5000, 10000), "LUX": (10000, 18000)},
    "CHILAS":   {"BUDGET": (1500, 4000), "MID": (4000, 9000),  "LUX": (8000, 15000)},
    "ASTORE":   {"BUDGET": (1500, 4000), "MID": (5000, 10000), "LUX": (10000, 18000)},
    "SHIGAR":   {"BUDGET": (2000, 5000), "MID": (6000, 14000), "LUX": (20000, 60000)},
    "KHAPLU":   {"BUDGET": (2000, 5000), "MID": (6000, 12000), "LUX": (15000, 35000)},
    "KHARMANG": {"BUDGET": (1500, 3500), "MID": (4000, 9000),  "LUX": (8000, 15000)},
    "NAGAR":    {"BUDGET": (2000, 5000), "MID": (6000, 12000), "LUX": (12000, 25000)},
    "BESHAM":   {"BUDGET": (1500, 3500), "MID": (3500, 7000),  "LUX": (7000, 12000)},
    "NARAN":    {"BUDGET": (2000, 4500), "MID": (4500, 9000),  "LUX": (9000, 20000)},
}

def season_from_month(month: int) -> str:
    if month in [11, 12, 1, 2]:
        return "WINTER"
    if month in [3, 4, 5]:
        return "SPRING"
    if month in [6, 7, 8]:
        return "SUMMER_PEAK"
    return "AUTUMN"

def sample_hotel_multiplier(month: int) -> float:
    s = season_from_month(month)
    if s == "WINTER":
        return random.uniform(0.5, 0.9)
    if s == "SPRING":
        return random.uniform(1.0, 1.3)
    if s == "SUMMER_PEAK":
        return random.uniform(1.5, 2.5)
    return random.uniform(0.8, 1.2)

def sample_transport_multiplier(month: int) -> float:
    s = season_from_month(month)
    if s == "WINTER":
        return random.uniform(0.95, 1.05)
    if s == "SPRING":
        return random.uniform(1.0, 1.10)
    if s == "SUMMER_PEAK":
        return random.uniform(1.10, 1.30)
    return random.uniform(0.95, 1.10)

def tier_from_bppd(bppd: float) -> str:
    if bppd < 5000: return "BUDGET"
    if bppd < 12000: return "MID"
    return "LUX"

def pace_from_days(days: int) -> str:
    if days <= 4: return "FAST"
    if days <= 8: return "NORMAL"
    return "RELAXED"

def label_rule(x):
    mode = x["travel_mode"]
    primary = x["primary_circuit"]
    road = x["road_option"]
    days = x["days"]
    bppd = x["bppd"]
    scope = x["scope"]

    if mode == "AIR":
        return "PLAN_SKARDU_AIR" if primary == "SKARDU_SIDE" else "PLAN_HUNZA_AIR"

    if scope == "LOOP" and road == "KKH" and days >= 10 and bppd >= 8000:
        return "PLAN_LOOP_KKH"

    if primary == "SKARDU_SIDE":
        if days <= 8 or bppd < 6500:
            return "PLAN_SKARDU_KKH_SHORT"
        return "PLAN_SKARDU_KKH_LONG"

    if days <= 6 or bppd < 5500:
        return "PLAN_HUNZA_KKH_SHORT"
    return "PLAN_HUNZA_KKH_LONG"

def rnd_range(tup):
    return random.uniform(tup[0], tup[1])

def public_oneway_cost(destination_key: str, comfort: str) -> float:
    if comfort == "BUDGET":
        return rnd_range(PUBLIC_COASTER[destination_key])
    if comfort == "LUX":
        return rnd_range(PUBLIC_YUTONG_AC.get(destination_key, PUBLIC_COASTER[destination_key]))
    a = rnd_range(PUBLIC_COASTER[destination_key])
    b = rnd_range(PUBLIC_YUTONG_AC.get(destination_key, PUBLIC_COASTER[destination_key]))
    return (a + b) / 2.0

def symmetric_lookup(d, a: str, b: str):
    a = a.upper().strip()
    b = b.upper().strip()
    if (a, b) in d:
        return d[(a, b)]
    if (b, a) in d:
        return d[(b, a)]
    return None

def internal_shared_cost(a: str, b: str) -> float:
    r = symmetric_lookup(INTERNAL_SHARED_SEAT, a, b)
    if r:
        return rnd_range(r)
    return random.uniform(400, 1200)

def internal_fullcar_cost(a: str, b: str) -> float:
    r = symmetric_lookup(INTERNAL_FULL_CAR, a, b)
    if r:
        return rnd_range(r)
    return random.uniform(6000, 14000)

def private_vehicle_cost_isb_oneway(destination_key: str, travelers: int) -> float:
    cars = max(1, (travelers + 3) // 4)
    one = PRIVATE_CAR_ONEWAY[destination_key]
    return one * cars

def hotel_price(city_key: str, comfort: str) -> float:
    city_key = city_key.upper().strip()
    if city_key not in HOTEL_RANGES:
        city_key = "GILGIT"
    return rnd_range(HOTEL_RANGES[city_key][comfort])

def flight_oneway(target: str, month: int) -> float:
    base = (22000, 32000) if target == "SKARDU" else (20000, 28000)
    m = sample_transport_multiplier(month)
    return rnd_range(base) * m

def comfort_from_label_and_mode(label: str, travel_mode: str) -> str:
    if travel_mode == "AIR":
        return random.choices(["MID", "LUX"], weights=[0.35, 0.65])[0]
    if label.endswith("SHORT"):
        return random.choices(["BUDGET", "MID"], weights=[0.65, 0.35])[0]
    if label.endswith("LONG"):
        return random.choices(["MID", "LUX"], weights=[0.6, 0.4])[0]
    if label == "PLAN_LOOP_KKH":
        return random.choices(["MID", "LUX"], weights=[0.7, 0.3])[0]
    return random.choice(["BUDGET", "MID", "LUX"])

def estimate_total_budget(x, comfort: str) -> int:
    days = x["days"]
    travelers = x["travelers"]
    month = x["month"]
    mode = x["travel_mode"]
    primary = x["primary_circuit"]
    scope = x["scope"]
    transport_type = x["transport_type"]

    hotel_mul = sample_hotel_multiplier(month)
    trans_mul = sample_transport_multiplier(month)

    dest = "SKARDU" if primary == "SKARDU_SIDE" else "HUNZA"
    air_target = "SKARDU" if primary == "SKARDU_SIDE" else "GILGIT"

    transport_total = 0.0

    if mode == "AIR":
        per_person = flight_oneway(air_target, month) * 2.0 + random.uniform(800, 2500) * trans_mul
        transport_total = per_person * travelers
    else:
        if transport_type == "PUBLIC":
            per_person = public_oneway_cost(dest, comfort) * 2.0 * trans_mul

            # internal movement typical for trips
            if primary == "SKARDU_SIDE":
                per_person += internal_shared_cost("SKARDU", "SHIGAR") * 2.0 * trans_mul
                if days >= 8:
                    per_person += internal_shared_cost("SKARDU", "KHAPLU") * trans_mul
                if days >= 10:
                    per_person += internal_shared_cost("SKARDU", "KARMANG") * trans_mul

            if primary == "HUNZA_SIDE":
                per_person += internal_shared_cost("GILGIT", "HUNZA") * 2.0 * trans_mul
                if days >= 10 and random.random() < 0.35:
                    per_person += internal_shared_cost("GILGIT", "PHANDER") * trans_mul

            # loop extra legs
            if scope == "LOOP":
                per_person += internal_shared_cost("GILGIT", "SKARDU") * trans_mul
                per_person += internal_shared_cost("GILGIT", "HUNZA") * trans_mul
                if days >= 12 and random.random() < 0.30:
                    per_person += internal_shared_cost("SKARDU", "ASTORE") * trans_mul

            transport_total = per_person * travelers

        else:
            # OWN means rent-a-car market (you can change later to fuel model)
            vehicle_rt = private_vehicle_cost_isb_oneway(dest, travelers) * 2.0 * trans_mul

            # add internal full-car bookings for movements and day trips
            internal = 0.0
            if primary == "SKARDU_SIDE":
                internal += internal_fullcar_cost("SKARDU", "SHIGAR") * trans_mul
                if days >= 8:
                    internal += internal_fullcar_cost("SKARDU", "KHAPLU") * trans_mul
                if days >= 10:
                    internal += internal_fullcar_cost("SKARDU", "KARMANG") * trans_mul
            else:
                internal += internal_fullcar_cost("GILGIT", "HUNZA") * trans_mul
                if days >= 10 and random.random() < 0.35:
                    internal += internal_fullcar_cost("GILGIT", "PHANDER") * trans_mul

            if scope == "LOOP":
                internal += internal_fullcar_cost("GILGIT", "SKARDU") * trans_mul
                internal += internal_fullcar_cost("GILGIT", "HUNZA") * trans_mul
                if days >= 12 and random.random() < 0.35:
                    internal += internal_fullcar_cost("SKARDU", "ASTORE") * trans_mul

            transport_total = vehicle_rt + internal

    rooms = max(1, (travelers + 1) // 2)
    nights = max(1, days - 1)

    if scope == "LOOP":
        main_cities = ["SKARDU", "HUNZA", "GILGIT"]
        avg_rate = sum(hotel_price(c, comfort) for c in main_cities) / len(main_cities)
    else:
        avg_rate = hotel_price(dest, comfort)

    transit_factor = random.uniform(0.80, 0.92)
    hotel_total = nights * rooms * avg_rate * transit_factor * hotel_mul

    if comfort == "BUDGET":
        food_ppd = random.uniform(1200, 2000)
        act_ppd = random.uniform(300, 700)
    elif comfort == "MID":
        food_ppd = random.uniform(2000, 3500)
        act_ppd = random.uniform(600, 1200)
    else:
        food_ppd = random.uniform(3500, 6500)
        act_ppd = random.uniform(900, 2000)

    food_total = food_ppd * travelers * days
    act_total = act_ppd * travelers * days

    subtotal = transport_total + hotel_total + food_total + act_total
    buffer = subtotal * random.uniform(0.08, 0.15)

    return int(round(subtotal + buffer))

def enforce_label_constraints(x, target_label: str) -> None:
    days = x["days"]
    travelers = x["travelers"]

    def set_min_bppd(min_bppd: float):
        btotal = int(min_bppd * travelers * days * random.uniform(1.02, 1.25))
        x["budget_total"] = max(x["budget_total"], btotal)
        x["bppd"] = round(x["budget_total"] / (travelers * days), 2)

    if target_label == "PLAN_LOOP_KKH":
        set_min_bppd(8000)
    if target_label == "PLAN_SKARDU_KKH_LONG":
        set_min_bppd(6500)
    if target_label == "PLAN_HUNZA_KKH_LONG":
        set_min_bppd(5500)

def sample_features_for_label(label: str):
    x = {}
    x["travelers"] = random.randint(1, 7)

    if label in ["PLAN_SKARDU_AIR", "PLAN_HUNZA_AIR"]:
        x["travel_mode"] = "AIR"
        x["road_option"] = "NONE"
        x["scope"] = "SINGLE"
        x["transport_type"] = random.choice(["PUBLIC", "OWN"])
        x["days"] = random.randint(4, 16)
        x["primary_circuit"] = "SKARDU_SIDE" if label == "PLAN_SKARDU_AIR" else "HUNZA_SIDE"
        x["month"] = random.randint(1, 12)
        return x

    x["travel_mode"] = "ROAD"
    x["transport_type"] = random.choice(["PUBLIC", "OWN"])
    x["month"] = random.randint(1, 12)

    # Babusar more likely in May-Oct
    if x["month"] in [5, 6, 7, 8, 9, 10] and random.random() < 0.35:
        x["road_option"] = "BABUSAR"
    else:
        x["road_option"] = "KKH"

    if label == "PLAN_LOOP_KKH":
        x["primary_circuit"] = random.choice(["SKARDU_SIDE", "HUNZA_SIDE"])
        x["scope"] = "LOOP"
        x["road_option"] = "KKH"
        x["days"] = random.randint(12, 21)
        return x

    if label == "PLAN_SKARDU_KKH_SHORT":
        x["primary_circuit"] = "SKARDU_SIDE"
        x["scope"] = random.choices(["SINGLE", "LOOP"], weights=[0.85, 0.15])[0]
        x["days"] = random.randint(3, 8)
        return x

    if label == "PLAN_SKARDU_KKH_LONG":
        x["primary_circuit"] = "SKARDU_SIDE"
        x["scope"] = random.choices(["SINGLE", "LOOP"], weights=[0.8, 0.2])[0]
        x["days"] = random.randint(9, 21)
        return x

    if label == "PLAN_HUNZA_KKH_SHORT":
        x["primary_circuit"] = "HUNZA_SIDE"
        x["scope"] = random.choices(["SINGLE", "LOOP"], weights=[0.85, 0.15])[0]
        x["days"] = random.randint(3, 6)
        return x

    if label == "PLAN_HUNZA_KKH_LONG":
        x["primary_circuit"] = "HUNZA_SIDE"
        x["scope"] = random.choices(["SINGLE", "LOOP"], weights=[0.8, 0.2])[0]
        x["days"] = random.randint(7, 21)
        return x

    x["primary_circuit"] = random.choice(["SKARDU_SIDE", "HUNZA_SIDE"])
    x["scope"] = "SINGLE"
    x["days"] = random.randint(3, 21)
    return x

def make_row_for_label(target_label: str):
    x = sample_features_for_label(target_label)
    comfort = comfort_from_label_and_mode(target_label, x["travel_mode"])

    x["budget_total"] = estimate_total_budget(x, comfort)
    x["bppd"] = round(x["budget_total"] / (x["travelers"] * x["days"]), 2)

    enforce_label_constraints(x, target_label)

    x["tier"] = tier_from_bppd(x["bppd"])
    x["pace"] = pace_from_days(x["days"])

    got = label_rule(x)
    if got != target_label:
        x["budget_total"] = int(x["budget_total"] * random.uniform(1.05, 1.25))
        x["bppd"] = round(x["budget_total"] / (x["travelers"] * x["days"]), 2)
        x["tier"] = tier_from_bppd(x["bppd"])
        x["pace"] = pace_from_days(x["days"])

    x["label"] = label_rule(x)

    return {
        "budget_total": int(x["budget_total"]),
        "days": int(x["days"]),
        "travelers": int(x["travelers"]),
        "month": int(x["month"]),
        "travel_mode": x["travel_mode"],
        "road_option": x["road_option"],
        "primary_circuit": x["primary_circuit"],
        "transport_type": x["transport_type"],
        "scope": x["scope"],
        "bppd": float(round(x["bppd"], 2)),
        "tier": x["tier"],
        "pace": x["pace"],
        "label": x["label"],
    }

def main():
    target_total = 280
    per_label = target_total // len(LABELS)

    counts = {lab: 0 for lab in LABELS}
    rows = []
    safety = 0

    while any(counts[lab] < per_label for lab in LABELS):
        safety += 1
        if safety > 30000:
            raise RuntimeError("Could not reach label targets; adjust constraints.")

        lab = min(LABELS, key=lambda k: counts[k])
        row = make_row_for_label(lab)
        if row["label"] != lab:
            continue

        rows.append(row)
        counts[lab] += 1

    df = pd.DataFrame(rows).sample(frac=1.0, random_state=42).reset_index(drop=True)

    os.makedirs("dataset", exist_ok=True)
    out = os.path.join("dataset", "train.csv")
    df.to_csv(out, index=False)

    print("Saved", out, "rows:", len(df))
    print("Label counts:", df["label"].value_counts().to_dict())
    print("Tier counts:", df["tier"].value_counts().to_dict())

if __name__ == "__main__":
    main()