const API_URL = "http://localhost:8000";

async function fetchVideos() {
  try {
    const response = await fetch(`${API_URL}/videos`);
    const videos = await response.json();
    renderVideoGrid(videos);
  } catch (error) {
    console.error("Error al cargar los videos:", error);
  }
}

function renderVideoGrid(videos) {
  const container = document.getElementById("video-container");
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  videos.forEach(video => {

    const card = document.createElement("div");
    card.className = "video-card";
    card.addEventListener("click", () => {
      window.location.href = `watch.html?id=${video.id}`;
    });

    const img = document.createElement("img");
    img.src = video.thumbnail_url;
    img.alt = video.title;

    const contentDiv = document.createElement("div");
    contentDiv.className = "video-card-content";

    const title = document.createElement("h3");
    title.textContent = video.title; 

    const category = document.createElement("p");
    category.textContent = `Categoría: ${video.category}`;


    contentDiv.appendChild(title);
    contentDiv.appendChild(category);
    card.appendChild(img);
    card.appendChild(contentDiv);
    container.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", fetchVideos);