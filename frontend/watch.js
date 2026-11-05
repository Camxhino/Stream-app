const API_URL = "http://localhost:8000";

const urlParams = new URLSearchParams(window.location.search);
const videoId = urlParams.get("id");

document.addEventListener("DOMContentLoaded", () => {
  if (!videoId) {
    window.location.href = "index.html";
    return;
  }
  loadVideoDetails(videoId);
});

async function loadVideoDetails(id) {
  try {
    const response = await fetch(`${API_URL}/videos/${id}`);
    if (!response.ok) throw new Error("Video no encontrado");
    
    const video = await response.json();
    
    document.getElementById("main-video").src = video.video_url;
    document.getElementById("video-title").textContent = video.title;
    document.getElementById("video-category").textContent = video.category;
    document.getElementById("video-description").textContent = video.description;

    renderComments(video.comments);

    loadRecommendations(video.category, video.id);

    setupCommentForm(id);

  } catch (error) {
    console.error("Error al cargar los detalles del video:", error);
  }
}

function renderComments(comments) {
  const container = document.getElementById("comments-container");
  
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  if (!comments || comments.length === 0) {
    const p = document.createElement("p");
    p.textContent = "No hay comentarios aún. ¡Sé el primero en comentar!";
    p.style.color = "#94a3b8";
    container.appendChild(p);
    return;
  }

  comments.forEach(comment => {
    const commentDiv = document.createElement("div");
    commentDiv.className = "comment-item";

    const authorH4 = document.createElement("h4");
    authorH4.textContent = comment.author;

    const contentP = document.createElement("p");
    contentP.textContent = comment.content;

    commentDiv.appendChild(authorH4);
    commentDiv.appendChild(contentP);
    container.appendChild(commentDiv);
  });
}

async function loadRecommendations(category, currentId) {
  try {
    const response = await fetch(`${API_URL}/videos/recommendations?category=${encodeURIComponent(category)}&exclude_id=${currentId}`);
    const recommendations = await response.json();
    renderRecommendations(recommendations);
  } catch (error) {
    console.error("Error al cargar recomendaciones:", error);
  }
}

function renderRecommendations(videos) {
  const container = document.getElementById("recommendations-container");
  
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  videos.forEach(video => {
    const card = document.createElement("div");
    card.className = "rec-card";
    card.addEventListener("click", () => {
      window.location.href = `watch.html?id=${video.id}`;
    });

    const img = document.createElement("img");
    img.src = video.thumbnail_url;
    img.alt = video.title;

    const infoDiv = document.createElement("div");
    infoDiv.className = "rec-info";

    const title = document.createElement("h4");
    title.textContent = video.title;

    const category = document.createElement("p");
    category.textContent = video.category;

    infoDiv.appendChild(title);
    infoDiv.appendChild(category);
    card.appendChild(img);
    card.appendChild(infoDiv);
    container.appendChild(card);
  });
}

function setupCommentForm(id) {
  const form = document.getElementById("comment-form");
  
  form.onsubmit = async (e) => {
    e.preventDefault();
    
    const authorInput = document.getElementById("comment-author");
    const contentInput = document.getElementById("comment-content");

    const newComment = {
      author: authorInput.value,
      content: contentInput.value
    };

    try {
      const response = await fetch(`${API_URL}/videos/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newComment)
      });

      if (response.ok) {
        const savedComment = await response.json();
        
        authorInput.value = "";
        contentInput.value = "";

        appendSingleComment(savedComment);
      }
    } catch (error) {
      console.error("Error al enviar el comentario:", error);
    }
  };
}

function appendSingleComment(comment) {
  const container = document.getElementById("comments-container");
  
  if (container.children.length === 1 && container.children[0].tagName === "P") {
    container.removeChild(container.firstChild);
  }

  const commentDiv = document.createElement("div");
  commentDiv.className = "comment-item";

  const authorH4 = document.createElement("h4");
  authorH4.textContent = comment.author;

  const contentP = document.createElement("p");
  contentP.textContent = comment.content;

  commentDiv.appendChild(authorH4);
  commentDiv.appendChild(contentP);
  container.appendChild(commentDiv);
}