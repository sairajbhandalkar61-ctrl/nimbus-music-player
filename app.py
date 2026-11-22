import streamlit as st
from src.data_preprocessing import load_and_preprocess
from src.recommender import train_knn_model, recommend_song

# --------------------------------------------------
# Page configuration
# --------------------------------------------------
st.set_page_config(
    page_title="Music Recommendation System",
    page_icon="🎵",
    layout="centered"
)

# --------------------------------------------------
# Load & preprocess data (cached)
# --------------------------------------------------
@st.cache_data
def load_data():
    return load_and_preprocess("data/spotify_dataset.csv")

df, X_scaled = load_data()

# Get detected song column
song_col = df.attrs["song_col"]

# Detect artist column (optional)
artist_col = None
for col in ["artists", "artist", "artist_name"]:
    if col in df.columns:
        artist_col = col
        break

# --------------------------------------------------
# Train KNN model (cached)
# --------------------------------------------------
@st.cache_resource
def load_model(X):
    return train_knn_model(X)

model = load_model(X_scaled)

# --------------------------------------------------
# UI
# --------------------------------------------------
st.title("🎵 Music Recommendation System")
st.write("Content-based music recommendation using Spotify audio features")

st.divider()

# Song selection
song_name = st.selectbox(
    "Select a song:",
    sorted(df[song_col].unique())
)

# Number of recommendations
top_n = st.slider(
    "Number of recommendations",
    min_value=3,
    max_value=10,
    value=5
)

# --------------------------------------------------
# Recommendation
# --------------------------------------------------
if st.button("Recommend 🎧"):
    recommendations = recommend_song(
        song_name,
        df,
        X_scaled,
        model,
        top_n=top_n
    )

    st.subheader("Recommended Songs")

    if recommendations:
        for i, song in enumerate(recommendations, start=1):
            if artist_col:
                artist = df[df[song_col] == song][artist_col].values[0]
                st.write(f"**{i}. {song}** — {artist}")
            else:
                st.write(f"**{i}. {song}**")
    else:
        st.warning("No recommendations found.")

st.divider()

st.caption(
    "Built using Spotify audio features | "
    "Content-Based Filtering | KNN with Cosine Similarity"
)
