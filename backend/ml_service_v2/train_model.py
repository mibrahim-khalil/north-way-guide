import os
import pandas as pd # type: ignore
from joblib import dump # type: ignore

from sklearn.model_selection import train_test_split # type: ignore
from sklearn.compose import ColumnTransformer # type: ignore
from sklearn.preprocessing import OneHotEncoder # type: ignore
from sklearn.pipeline import Pipeline # type: ignore
from sklearn.ensemble import RandomForestClassifier # type: ignore
from sklearn.metrics import classification_report, accuracy_score # type: ignore

def main():
    path = os.path.join("dataset", "train.csv")
    if not os.path.exists(path):
        raise FileNotFoundError("dataset/train.csv not found. Run generate_dataset.py first.")

    df = pd.read_csv(path)
    print("Rows:", len(df))
    print(df["label"].value_counts())

    X = df[
        [
            "budget_total","days","travelers","month",
            "travel_mode","road_option",
            "primary_circuit","transport_type","scope",
            "bppd","tier","pace"
        ]
    ]
    y = df["label"]

    cat_cols = ["travel_mode","road_option","primary_circuit","transport_type","scope","tier","pace"]
    num_cols = ["budget_total","days","travelers","month","bppd"]

    pre = ColumnTransformer(
        [
            ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
            ("num", "passthrough", num_cols),
        ]
    )

    rf = RandomForestClassifier(
        n_estimators=500,
        random_state=42,
        n_jobs=-1
    )

    pipe = Pipeline([("pre", pre), ("rf", rf)])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("Training...")
    pipe.fit(X_train, y_train)
    print("Done.")

    pred = pipe.predict(X_test)
    print("Accuracy:", accuracy_score(y_test, pred))
    print(classification_report(y_test, pred))

    dump(pipe, "model.joblib")
    print("Saved model.joblib bytes:", os.path.getsize("model.joblib"))

if __name__ == "__main__":
    main()