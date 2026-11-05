from pydantic import BaseModel
from typing import Optional

class VideoCreate(BaseModel):
    title: str
    description: str
    category: str
    video_url: str
    thumbnail_url: str

class CommentCreate(BaseModel):
    author: str
    content: str

class UploadRequest(BaseModel):
    filename: str
    content_type: str