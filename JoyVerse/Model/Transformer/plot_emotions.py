import matplotlib.pyplot as plt
from pymongo import MongoClient
import pandas as pd

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["emotion_db"]
collection = db["emotion_predictions"]

# Fetch all documents
records = list(collection.find({}))
if not records:
    print("⚠️ No data found in the database.")
    exit()

# Convert to DataFrame
df = pd.DataFrame(records)

# Fix: Convert ISO format timestamps to datetime
df["timestamp"] = pd.to_datetime(df["timestamp"], format='ISO8601', errors='coerce')

# Drop any rows with NaT timestamps
df.dropna(subset=["timestamp"], inplace=True)

# Sort by timestamp
df.sort_values("timestamp", inplace=True)

# ---------------------- Line Plot --------------------------
plt.figure(figsize=(12, 6))
for emotion in df["emotion"].unique():
    subset = df[df["emotion"] == emotion]
    plt.plot(subset["timestamp"], subset["confidence"], marker='o', label=emotion)

plt.xlabel("Timestamp")
plt.ylabel("Confidence (%)")
plt.title("Emotion Confidence Over Time")
plt.legend()
plt.grid(True)
plt.tight_layout()
plt.savefig("emotion_trend_db.png")
print("📈 Saved: emotion_trend_db.png")
plt.show()

# ---------------------- Pie Chart --------------------------
emotion_counts = df["emotion"].value_counts()

plt.figure(figsize=(6, 6))
plt.pie(
    emotion_counts,
    labels=emotion_counts.index,
    autopct='%1.1f%%',
    startangle=140,
    shadow=True
)
plt.title("Overall Emotion Distribution")
plt.tight_layout()
plt.savefig("emotion_distribution_db.png")
print("🥧 Saved: emotion_distribution_db.png")
plt.show()
