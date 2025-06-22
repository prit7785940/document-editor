import React, { useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const Download = () => {
  const { roomId } = useParams();

  useEffect(() => {
    const downloadText = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3001/download/${roomId}`,
          {
            responseType: "blob", // important for downloading
          }
        );

        // Create blob and download link
        const blob = new Blob([response.data], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `room-${roomId}.txt`);
        document.body.appendChild(link);
        link.click();

        // Clean up
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error("❌ Error downloading text file:", err);
        alert("Download failed. Please try again.");
      }
    };

    downloadText();
  }, [roomId]);

  return (
    <div className="text-center mt-5">
      <h3>📥 Preparing download...</h3>
      <p>If the download doesn't start automatically, please try again later.</p>
    </div>
  );
};

export default Download;
