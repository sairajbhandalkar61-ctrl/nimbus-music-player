import numpy as np
from sklearn.neighbors import NearestNeighbors

def train_knn_model(X_scaled, n_neighbors=50):
    """
    Train brute-force cosine NearestNeighbors model.
    Fitting with n_neighbors=50 allows kneighbors queries up to 50 neighbors without re-fitting.
    """
    model = NearestNeighbors(
        n_neighbors=n_neighbors,
        metric='cosine',
        algorithm='brute'
    )
    model.fit(X_scaled)
    return model

def recommend_by_id(track_id: str, df, X_scaled, model, id_to_index: dict = None, top_k: int = 8):
    """
    Exact-behaviour cosine KNN recommendation using Spotify track ID as primary key.
    Fixes duplicate song name collisions and dynamically queries up to top_k neighbors.
    Returns list of dicts with track metadata and cosine similarity score (0.0 to 1.0).
    """
    if id_to_index is None:
        id_to_index = df.attrs.get('id_to_index', {})

    if track_id not in id_to_index:
        return []

    idx = id_to_index[track_id]
    query_vec = X_scaled[idx].reshape(1, -1)

    # Dynamic k query
    n_query = top_k + 1
    distances, indices = model.kneighbors(query_vec, n_neighbors=n_query)

    results = []
    seed_row = df.iloc[idx]
    seed_energy = float(seed_row.get("energy", 0.5))
    seed_valence = float(seed_row.get("valence", 0.5))
    seed_dance = float(seed_row.get("danceability", 0.5))
    seed_tempo = float(seed_row.get("tempo", 120.0))

    # Skip self at index 0
    for dist, neighbor_idx in zip(distances[0][1:], indices[0][1:]):
        row = df.iloc[neighbor_idx]
        similarity = float(np.clip(1.0 - dist, 0.0, 1.0))
        rec_energy = float(row.get("energy", 0.5))
        rec_valence = float(row.get("valence", 0.5))
        rec_dance = float(row.get("danceability", 0.5))
        rec_tempo = float(row.get("tempo", 120.0))

        d_energy = round(rec_energy - seed_energy, 3)
        d_valence = round(rec_valence - seed_valence, 3)
        d_dance = round(rec_dance - seed_dance, 3)
        d_tempo = round(rec_tempo - seed_tempo, 1)

        # Pick top 2 closest normalized traits to explain the match
        closeness = [
            ("Energy", abs(d_energy)),
            ("Mood", abs(d_valence)),
            ("Groove", abs(d_dance)),
            ("BPM", abs(d_tempo) / 100.0),
        ]
        closeness.sort(key=lambda item: item[1])
        match_reason = f"Similar {closeness[0][0]} & {closeness[1][0]}"

        results.append({
            "id": str(row["id"]),
            "name": str(row["name"]),
            "artists": str(row.get("artists_clean", row.get("artists", ""))),
            "year": int(row.get("year", 0)),
            "popularity": int(row.get("popularity", 0)),
            "duration_ms": int(row.get("duration_ms", 0)),
            "similarity": round(similarity, 4),
            "valence": rec_valence,
            "energy": rec_energy,
            "danceability": rec_dance,
            "acousticness": float(row.get("acousticness", 0.5)),
            "tempo": rec_tempo,
            "key": int(row.get("key", 0)),
            "mode": int(row.get("mode", 1)),
            "mood": str(row.get("mood", "chill")),
            "genre": str(row.get("genre", "indie")),
            "decade": int(row.get("decade", 2000)),
            "feature_deltas": {
                "energy": d_energy,
                "valence": d_valence,
                "danceability": d_dance,
                "tempo": d_tempo,
            },
            "match_reason": match_reason,
        })

    return results

def recommend_song(song_name, df, X_scaled, model, top_n=5):
    """
    Original Streamlit signature preserved.
    Fixes bug where asking for >5 returned only 5 by passing n_neighbors=top_n + 1 to kneighbors.
    """
    song_col = df.attrs.get('song_col', 'name')

    if song_name not in df[song_col].values:
        return []

    # Get index of matching song
    song_indices = df[df[song_col] == song_name].index
    song_index = song_indices[0]

    distances, indices = model.kneighbors(
        [X_scaled[song_index]],
        n_neighbors=top_n + 1
    )

    recommendations = []
    for i in indices[0][1:top_n + 1]:
        recommendations.append(df.iloc[i][song_col])

    return recommendations
