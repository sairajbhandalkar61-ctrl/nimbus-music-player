"""
Preprocessing pipeline for MTG-Jamendo Dataset.
Produces:
- backend/data/processed/music_catalog.csv
- backend/data/processed/genre_features.csv
- backend/data/processed/mood_features.csv
- backend/data/processed/instrument_features.csv
- backend/data/processed/recommendation_features.csv
"""

import os
import re
import csv
import logging
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data", "mtg-jamendo", "data")
LICENSE_FILE = os.path.join(BASE_DIR, "data", "mtg-jamendo", "audio_licenses.txt")
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")

os.makedirs(PROCESSED_DIR, exist_ok=True)

def parse_audio_licenses():
    logging.info("Parsing audio_licenses.txt...")
    licenses = {}
    if not os.path.exists(LICENSE_FILE):
        logging.warning("audio_licenses.txt not found at %s", LICENSE_FILE)
        return licenses

    with open(LICENSE_FILE, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read()

    blocks = text.split("\n\n")
    for b in blocks:
        lines = [line.strip() for line in b.strip().split("\n") if line.strip()]
        if len(lines) >= 3:
            mp3_path = lines[0]
            credit = lines[1]
            lic_line = lines[2]
            
            # Extract track ID from credit url e.g. http://www.jamendo.com/track/214
            m = re.search(r"track/(\d+)", credit)
            if not m:
                m = re.search(r"/(\d+)\.mp3", mp3_path)
            
            if m:
                track_num = int(m.group(1))
                track_id = f"track_{track_num:07d}"
                
                # Extract license text and license url
                lic_match = re.search(r"Available under a (.+?) license:\s*(https?://[^\s]+)", lic_line, re.IGNORECASE)
                if lic_match:
                    lic_name = lic_match.group(1).strip()
                    lic_url = lic_match.group(2).strip()
                else:
                    lic_name = lic_line
                    lic_url = ""

                licenses[track_id] = {
                    "attribution": credit,
                    "license": lic_name,
                    "license_url": lic_url,
                    "track_num": track_num
                }

    logging.info("Parsed licenses for %d tracks.", len(licenses))
    return licenses

def load_metadata():
    meta_path = os.path.join(DATA_DIR, "raw.meta.tsv")
    logging.info("Loading raw.meta.tsv from %s...", meta_path)
    
    meta_df = pd.read_csv(
        meta_path,
        sep="\t",
        quoting=csv.QUOTE_NONE,
        dtype=str,
        on_bad_lines="skip"
    )
    meta_df.columns = [col.strip().upper() for col in meta_df.columns]
    
    # Missing value handling
    meta_df["TRACK_NAME"] = meta_df["TRACK_NAME"].fillna("Untitled")
    meta_df["ARTIST_NAME"] = meta_df["ARTIST_NAME"].fillna("Unknown Artist")
    meta_df["ALBUM_NAME"] = meta_df["ALBUM_NAME"].fillna("Unknown Album")
    meta_df["RELEASEDATE"] = meta_df["RELEASEDATE"].fillna("")
    
    # Drop duplicates on TRACK_ID
    meta_df = meta_df.drop_duplicates(subset=["TRACK_ID"])
    logging.info("Loaded %d unique track metadata records.", len(meta_df))
    return meta_df

def load_tags_and_duration():
    raw_path = os.path.join(DATA_DIR, "raw.tsv")
    logging.info("Loading raw.tsv from %s for duration and tags...", raw_path)
    
    track_info = {}
    with open(raw_path, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.reader(f, delimiter="\t")
        header = next(reader, None)
        for row in reader:
            if len(row) < 5:
                continue
            tid = row[0].strip()
            try:
                duration = float(row[4])
            except ValueError:
                duration = 0.0
            
            raw_tags = row[5:] if len(row) > 5 else []
            genres = []
            moods = []
            instruments = []
            all_tags = []
            
            for t in raw_tags:
                t = t.strip()
                if not t:
                    continue
                if "---" in t:
                    cat, val = t.split("---", 1)
                    val = val.strip().lower()
                    if cat == "genre":
                        genres.append(val)
                    elif cat in ("mood/theme", "mood"):
                        moods.append(val)
                    elif cat == "instrument":
                        instruments.append(val)
                    all_tags.append(val)
                else:
                    all_tags.append(t.lower())
            
            track_info[tid] = {
                "duration": duration,
                "genres": genres,
                "moods": moods,
                "instruments": instruments,
                "all_tags": all_tags
            }
            
    logging.info("Loaded duration and tags for %d tracks.", len(track_info))
    return track_info

def build_music_catalog(meta_df, track_info, licenses):
    logging.info("Merging metadata, audio features, tags, and license attributions...")
    
    catalog_rows = []
    for _, row in meta_df.iterrows():
        tid = row["TRACK_ID"]
        t_data = track_info.get(tid, {
            "duration": 0.0,
            "genres": [],
            "moods": [],
            "instruments": [],
            "all_tags": []
        })
        
        # Track numeric ID for streaming URL
        try:
            track_num = int(tid.replace("track_", ""))
        except ValueError:
            track_num = 0
            
        album_id = row.get("ALBUM_ID", "")
        try:
            album_num = int(album_id.replace("album_", ""))
        except ValueError:
            album_num = 0
            
        lic_info = licenses.get(tid, {
            "attribution": f"{row['TRACK_NAME']} by {row['ARTIST_NAME']} (Jamendo)",
            "license": "Creative Commons Attribution-NonCommercial-ShareAlike",
            "license_url": "https://creativecommons.org/licenses/by-nc-sa/3.0/",
            "track_num": track_num
        })
        
        audio_url = f"https://mp3d.jamendo.com/download/track/{track_num}/mp32/"
        cover_url = f"https://usercontent.jamendo.com?type=album&id={album_num}&width=500" if album_num > 0 else ""
        source_url = row.get("URL", f"http://www.jamendo.com/track/{track_num}")
        
        genres_str = ", ".join(sorted(set(t_data["genres"])))
        moods_str = ", ".join(sorted(set(t_data["moods"])))
        instruments_str = ", ".join(sorted(set(t_data["instruments"])))
        all_tags_str = " ".join(sorted(set(t_data["all_tags"])))
        
        catalog_rows.append({
            "track_id": tid,
            "title": row["TRACK_NAME"],
            "artist": row["ARTIST_NAME"],
            "album": row["ALBUM_NAME"],
            "artist_id": row.get("ARTIST_ID", ""),
            "album_id": album_id,
            "duration": t_data["duration"],
            "release_date": row.get("RELEASEDATE", ""),
            "genres": genres_str,
            "moods": moods_str,
            "instruments": instruments_str,
            "all_tags": all_tags_str,
            "audio_url": audio_url,
            "cover_url": cover_url,
            "license": lic_info["license"],
            "license_url": lic_info["license_url"],
            "attribution": lic_info["attribution"],
            "source_url": source_url,
        })
        
    catalog_df = pd.DataFrame(catalog_rows)
    catalog_path = os.path.join(PROCESSED_DIR, "music_catalog.csv")
    catalog_df.to_csv(catalog_path, index=False)
    logging.info("Saved clean music catalog to %s (%d rows).", catalog_path, len(catalog_df))
    return catalog_df

def generate_feature_matrices(catalog_df):
    logging.info("Generating TF-IDF feature matrices for genres, moods, instruments, and recommendations...")
    
    # 1. Genre features
    genre_corpus = catalog_df["genres"].fillna("").apply(lambda s: " ".join(s.split(", ")))
    genre_vec = TfidfVectorizer(max_features=100, token_pattern=r"(?u)\b[\w-]+\b")
    genre_matrix = genre_vec.fit_transform(genre_corpus)
    genre_feature_names = [f"genre_{name}" for name in genre_vec.get_feature_names_out()]
    genre_df = pd.DataFrame(genre_matrix.toarray(), columns=genre_feature_names)
    genre_df.insert(0, "track_id", catalog_df["track_id"])
    genre_path = os.path.join(PROCESSED_DIR, "genre_features.csv")
    genre_df.to_csv(genre_path, index=False)
    logging.info("Saved genre features to %s (shape %s).", genre_path, genre_df.shape)
    
    # 2. Mood features
    mood_corpus = catalog_df["moods"].fillna("").apply(lambda s: " ".join(s.split(", ")))
    mood_vec = TfidfVectorizer(max_features=100, token_pattern=r"(?u)\b[\w-]+\b")
    mood_matrix = mood_vec.fit_transform(mood_corpus)
    mood_feature_names = [f"mood_{name}" for name in mood_vec.get_feature_names_out()]
    mood_df = pd.DataFrame(mood_matrix.toarray(), columns=mood_feature_names)
    mood_df.insert(0, "track_id", catalog_df["track_id"])
    mood_path = os.path.join(PROCESSED_DIR, "mood_features.csv")
    mood_df.to_csv(mood_path, index=False)
    logging.info("Saved mood features to %s (shape %s).", mood_path, mood_df.shape)
    
    # 3. Instrument features
    inst_corpus = catalog_df["instruments"].fillna("").apply(lambda s: " ".join(s.split(", ")))
    inst_vec = TfidfVectorizer(max_features=80, token_pattern=r"(?u)\b[\w-]+\b")
    inst_matrix = inst_vec.fit_transform(inst_corpus)
    inst_feature_names = [f"inst_{name}" for name in inst_vec.get_feature_names_out()]
    inst_df = pd.DataFrame(inst_matrix.toarray(), columns=inst_feature_names)
    inst_df.insert(0, "track_id", catalog_df["track_id"])
    inst_path = os.path.join(PROCESSED_DIR, "instrument_features.csv")
    inst_df.to_csv(inst_path, index=False)
    logging.info("Saved instrument features to %s (shape %s).", inst_path, inst_df.shape)
    
    # 4. Recommendation features (combined all_tags + artist tokens)
    rec_corpus = (
        catalog_df["all_tags"].fillna("") + " " +
        catalog_df["genres"].fillna("").apply(lambda s: s.replace(",", "")) + " " +
        catalog_df["moods"].fillna("").apply(lambda s: s.replace(",", "")) + " " +
        catalog_df["instruments"].fillna("").apply(lambda s: s.replace(",", "")) + " " +
        catalog_df["artist"].fillna("").apply(lambda s: "artist_" + re.sub(r"\W+", "", s.lower()))
    )
    rec_vec = TfidfVectorizer(max_features=150, token_pattern=r"(?u)\b[\w-]+\b")
    rec_matrix = rec_vec.fit_transform(rec_corpus)
    rec_feature_names = [f"rec_{name}" for name in rec_vec.get_feature_names_out()]
    rec_df = pd.DataFrame(rec_matrix.toarray(), columns=rec_feature_names)
    rec_df.insert(0, "track_id", catalog_df["track_id"])
    rec_path = os.path.join(PROCESSED_DIR, "recommendation_features.csv")
    rec_df.to_csv(rec_path, index=False)
    logging.info("Saved recommendation features to %s (shape %s).", rec_path, rec_df.shape)
    
    logging.info("Feature engineering complete!")

def main():
    licenses = parse_audio_licenses()
    meta_df = load_metadata()
    track_info = load_tags_and_duration()
    catalog_df = build_music_catalog(meta_df, track_info, licenses)
    generate_feature_matrices(catalog_df)
    logging.info("MTG-Jamendo dataset processing completed successfully!")

if __name__ == "__main__":
    main()
