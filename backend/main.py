from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from datetime import datetime
import random
from database import create_db_and_tables, get_db_connection
from models import VideoCreate, CommentCreate, UploadRequest
from s3_service import generate_presigned_upload_url

app = FastAPI(title="Video Streaming API (SQLite Puro)", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/videos")
def get_videos(category: Optional[str] = None, search: Optional[str] = None):
    """Obtiene el catálogo completo de videos con opción de filtrado y búsqueda."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM video WHERE 1=1"
    params = []
    
    if category:
        query += " AND category = ?"
        params.append(category)
    if search:
        query += " AND title LIKE ?"
        params.append(f"%{search}%")
        
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

@app.get("/videos/recommendations")
def get_recommendations(category: str, exclude_id: int):
    """Retorna hasta 10 recomendaciones aleatorias basadas en la categoría."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM video WHERE category = ? AND id != ?", (category, exclude_id))
    rows = cursor.fetchall()
    conn.close()
    
    videos = [dict(row) for row in rows]
    if len(videos) > 10:
        return random.sample(videos, 10)
    return videos

@app.get("/videos/{video_id}")
def get_video_detail(video_id: int):
    """Obtiene los detalles completos de un video específico junto con sus comentarios."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM video WHERE id = ?", (video_id,))
    video = cursor.fetchone()
    
    if not video:
        conn.close()
        raise HTTPException(status_code=404, detail="Video no encontrado")
        
    cursor.execute("SELECT * FROM comment WHERE video_id = ?", (video_id,))
    comments = cursor.fetchall()
    conn.close()
    
    return {
        "video": dict(video),
        "comments": [dict(c) for c in comments]
    }

@app.post("/videos")
def create_video(video: VideoCreate):
    """Registra un nuevo video en la base de datos."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Generamos la fecha actual en formato texto/ISO para SQLite
    current_time = datetime.utcnow().isoformat()
    
    cursor.execute("""
        INSERT INTO video (title, description, category, video_url, thumbnail_url, views, created_at)
        VALUES (?, ?, ?, ?, ?, 0, ?)
    """, (video.title, video.description, video.category, video.video_url, video.thumbnail_url, current_time))
    
    conn.commit()
    video_id = cursor.lastrowid
    
    cursor.execute("SELECT * FROM video WHERE id = ?", (video_id,))
    new_video = dict(cursor.fetchone())
    conn.close()
    
    return new_video

@app.post("/videos/{video_id}/comments")
def create_comment(video_id: int, comment: CommentCreate):
    """Crea y almacena un nuevo comentario asociado a un video."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM video WHERE id = ?", (video_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Video no encontrado")
        
    cursor.execute("""
        INSERT INTO comment (video_id, author, content)
        VALUES (?, ?, ?)
    """, (video_id, comment.author, comment.content))
    
    conn.commit()
    comment_id = cursor.lastrowid
    
    cursor.execute("SELECT * FROM comment WHERE id = ?", (comment_id,))
    db_comment = dict(cursor.fetchone())
    conn.close()
    
    return db_comment

@app.post("/s3/presigned-url")
def get_presigned_url(payload: UploadRequest):
    """Genera una URL prefirmada de AWS S3."""
    file_key = f"media/{payload.filename}"
    result = generate_presigned_upload_url(file_key, payload.content_type)
    
    if not result:
        raise HTTPException(status_code=500, detail="No se pudo generar la URL de S3")
    
    return result