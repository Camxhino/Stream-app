const API_URL = "http://localhost:8000";

document.getElementById("upload-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const category = document.getElementById("category").value;
  const thumbnailFile = document.getElementById("thumbnail-file").files[0];
  const videoFile = document.getElementById("video-file").files[0];
  const statusDiv = document.getElementById("upload-status");

  while (statusDiv.firstChild) {
    statusDiv.removeChild(statusDiv.firstChild);
  }

  const statusMsg = document.createElement("p");
  statusMsg.textContent = "Obteniendo URLs prefirmadas de S3...";
  statusMsg.style.color = "#38bdf8";
  statusDiv.appendChild(statusMsg);

  try {
    const thumbRes = await fetch(`${API_URL}/s3/presigned-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: thumbnailFile.name, content_type: thumbnailFile.type })
    });
    const thumbData = await thumbRes.json();

    const videoRes = await fetch(`${API_URL}/s3/presigned-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: videoFile.name, content_type: videoFile.type })
    });
    const videoData = await videoRes.json();

    statusMsg.textContent = "Subiendo archivos directamente a AWS S3...";

    await fetch(thumbData.upload_url, {
      method: "PUT",
      headers: { "Content-Type": thumbnailFile.type },
      body: thumbnailFile
    });

    await fetch(videoData.upload_url, {
      method: "PUT",
      headers: { "Content-Type": videoFile.type },
      body: videoFile
    });

    statusMsg.textContent = "Registrando video en la base de datos (SQLModel)...";

    const payload = {
      title,
      description,
      category,
      video_url: videoData.file_url,
      thumbnail_url: thumbData.file_url
    };

    const saveRes = await fetch(`${API_URL}/videos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!saveRes.ok) throw new Error("No se pudo guardar el video en la base de datos");

    statusMsg.textContent = "¡Video subido y registrado con éxito!";
    statusMsg.style.color = "#22c55e";

    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);

  } catch (error) {
    console.error("Error durante el proceso de subida:", error);
    statusMsg.textContent = "Ocurrió un error al subir el contenido. Revisa la consola.";
    statusMsg.style.color = "#ef4444";
  }
});