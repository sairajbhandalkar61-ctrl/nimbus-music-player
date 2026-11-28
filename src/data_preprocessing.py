import ast
import gc
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

FEATURE_COLUMNS = [
    'danceability', 'energy', 'loudness',
    'speechiness', 'acousticness',
    'instrumentalness', 'liveness',
    'valence', 'tempo'
]


def parse_artists(artists_val):
    """Safely parse Spotify artists column from stringified list to clean 'Artist 1, Artist 2' string."""
    if isinstance(artists_val, list):
        return ", ".join(str(a).strip() for a in artists_val if str(a).strip())
    if not isinstance(artists_val, str):
        return str(artists_val) if pd.notna(artists_val) else "Unknown Artist"

    artists_str = artists_val.strip()
    if artists_str.startswith("[") and artists_str.endswith("]"):
        try:
            parsed = ast.literal_eval(artists_str)
            if isinstance(parsed, list):
                return ", ".join(str(a).strip() for a in parsed if str(a).strip())
        except (ValueError, SyntaxError):
            cleaned = artists_str.strip("[]").replace("'", "").replace('"', "")
            return ", ".join(part.strip() for part in cleaned.split(",") if part.strip())
    return artists_str


def compute_mood_bucket(valence: float, energy: float) -> str:
    """Categorize track into one of 4 mood quadrants based on valence and energy."""
    if valence >= 0.5 and energy >= 0.5:
        return "euphoric"
    elif valence >= 0.5 and energy < 0.5:
        return "chill"
    elif valence < 0.5 and energy < 0.5:
        return "melancholic"
    else:
        return "intense"


def compute_genre(speech, dance, energy, acoustic, instr) -> str:
    """Classify track into broad genres using acoustic profile."""
    if speech > 0.18:
        return "hip-hop"
    if instr > 0.45 or (acoustic > 0.8 and energy < 0.3):
        return "classical"
    if dance > 0.68 and energy > 0.65 and acoustic < 0.2:
        return "electronic"
    if energy > 0.65 and acoustic < 0.25:
        return "rock"
    if acoustic > 0.7 and energy < 0.45:
        return "acoustic"
    if dance > 0.6 and energy > 0.5:
        return "pop"
    if dance > 0.5 and acoustic > 0.4:
        return "jazz"
    return "indie"


def compute_decade(year: int) -> int:
    """Compute decade integer (e.g. 1980 for 1984)."""
    try:
        y = int(year)
        return (y // 10) * 10
    except (ValueError, TypeError):
        return 2000


def load_and_preprocess(data_path="data/spotify_dataset.csv"):
    float32_cols = [
        'valence', 'energy', 'danceability', 'loudness',
        'speechiness', 'acousticness', 'instrumentalness', 'liveness', 'tempo'
    ]
    int32_cols = ['year', 'popularity', 'duration_ms', 'key', 'mode']
    dtype_map = {col: np.float32 for col in float32_cols}
    dtype_map.update({col: np.int32 for col in int32_cols})

    df = pd.read_csv(data_path, dtype=dtype_map, low_memory=False)
    df.dropna(subset=['name', 'artists', 'id'], inplace=True)

    possible_song_cols = ['name', 'track_name', 'song', 'title']
    song_col = 'name'
    for col in possible_song_cols:
        if col in df.columns:
            song_col = col
            break
    df.attrs['song_col'] = song_col

    # Format artists column cleanly, then drop raw unparsed column to save RAM
    df['artists_clean'] = df['artists'].map(parse_artists)
    df.drop(columns=['artists'], inplace=True)

    # Deduplicate by (name, artists_clean)
    df.drop_duplicates(subset=[song_col, 'artists_clean'], keep='first', inplace=True)

    # Sort once by popularity descending so all subsequent slices are already ranked by popularity
    if 'popularity' in df.columns:
        df.sort_values(by='popularity', ascending=False, inplace=True)
    df.reset_index(drop=True, inplace=True)

    # Vectorized decade calculation
    if 'year' in df.columns:
        years = pd.to_numeric(df['year'], errors='coerce').fillna(2000).to_numpy(dtype=np.int32)
        df['decade'] = ((years // 10) * 10).astype(np.int32)
    else:
        df['decade'] = np.full(len(df), 2000, dtype=np.int32)

    # Vectorized mood classification
    valence = df['valence'].to_numpy(dtype=np.float32) if 'valence' in df.columns else np.full(len(df), 0.5, dtype=np.float32)
    energy = df['energy'].to_numpy(dtype=np.float32) if 'energy' in df.columns else np.full(len(df), 0.5, dtype=np.float32)
    df['mood'] = np.select(
        [
            (valence >= 0.5) & (energy >= 0.5),
            (valence >= 0.5) & (energy < 0.5),
            (valence < 0.5) & (energy < 0.5),
        ],
        ['euphoric', 'chill', 'melancholic'],
        default='intense',
    )

    # Vectorized genre classification
    speech = df['speechiness'].to_numpy(dtype=np.float32) if 'speechiness' in df.columns else np.zeros(len(df), dtype=np.float32)
    dance = df['danceability'].to_numpy(dtype=np.float32) if 'danceability' in df.columns else np.zeros(len(df), dtype=np.float32)
    acoustic = df['acousticness'].to_numpy(dtype=np.float32) if 'acousticness' in df.columns else np.zeros(len(df), dtype=np.float32)
    instr = df['instrumentalness'].to_numpy(dtype=np.float32) if 'instrumentalness' in df.columns else np.zeros(len(df), dtype=np.float32)

    df['genre'] = np.select(
        [
            speech > 0.18,
            (instr > 0.45) | ((acoustic > 0.8) & (energy < 0.3)),
            (dance > 0.68) & (energy > 0.65) & (acoustic < 0.2),
            (energy > 0.65) & (acoustic < 0.25),
            (acoustic > 0.7) & (energy < 0.45),
            (dance > 0.6) & (energy > 0.5),
            (dance > 0.5) & (acoustic > 0.4),
        ],
        ['hip-hop', 'classical', 'electronic', 'rock', 'acoustic', 'pop', 'jazz'],
        default='indie',
    )

    # Scale 9 core audio features into float32 to halve KNN memory footprint
    features_present = [f for f in FEATURE_COLUMNS if f in df.columns]
    X = df[features_present].to_numpy(dtype=np.float32)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X).astype(np.float32)

    # Index by Spotify ID
    id_to_index = {str(row_id): idx for idx, row_id in enumerate(df['id'].to_numpy())}
    df.attrs['id_to_index'] = id_to_index
    df.attrs['scaler'] = scaler
    df.attrs['features'] = features_present

    gc.collect()
    return df, X_scaled
