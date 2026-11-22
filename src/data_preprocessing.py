import ast
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
    df = pd.read_csv(data_path)
    df.dropna(subset=['name', 'artists', 'id'], inplace=True)
    
    possible_song_cols = ['name', 'track_name', 'song', 'title']
    song_col = 'name'
    for col in possible_song_cols:
        if col in df.columns:
            song_col = col
            break
    df.attrs['song_col'] = song_col

    # Format artists column safely
    df['artists_clean'] = df['artists'].apply(parse_artists)

    # Deduplicate by (name, artists_clean)
    df.drop_duplicates(subset=[song_col, 'artists_clean'], keep='first', inplace=True)

    # Sort once by popularity descending so all subsequent slices are already ranked by popularity!
    if 'popularity' in df.columns:
        df.sort_values(by='popularity', ascending=False, inplace=True)
    df.reset_index(drop=True, inplace=True)

    # Calculate decade, mood, and genre
    if 'year' in df.columns:
        df['decade'] = df['year'].apply(compute_decade)
    else:
        df['decade'] = 2000

    valence_col = df['valence'] if 'valence' in df.columns else 0.5
    energy_col = df['energy'] if 'energy' in df.columns else 0.5
    df['mood'] = df.apply(lambda r: compute_mood_bucket(r['valence'], r['energy']), axis=1)

    # Classify genres
    df['genre'] = df.apply(
        lambda r: compute_genre(
            r.get('speechiness', 0),
            r.get('danceability', 0),
            r.get('energy', 0),
            r.get('acousticness', 0),
            r.get('instrumentalness', 0)
        ),
        axis=1
    )

    # Scale 9 core audio features
    features_present = [f for f in FEATURE_COLUMNS if f in df.columns]
    X = df[features_present]
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Index by Spotify ID
    id_to_index = {row_id: idx for idx, row_id in enumerate(df['id'].values)}
    df.attrs['id_to_index'] = id_to_index
    df.attrs['scaler'] = scaler
    df.attrs['features'] = features_present

    return df, X_scaled
