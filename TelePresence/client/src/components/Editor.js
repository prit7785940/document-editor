import React, { useEffect, useRef } from "react";
import "codemirror/mode/javascript/javascript";
import "codemirror/theme/dracula.css";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import "codemirror/lib/codemirror.css";
import CodeMirror from "codemirror";
import axios from "axios"; // For API requests
import { ACTIONS } from "../Actions";

function Editor({ socketRef, roomId, onCodeChange }) {
  const editorRef = useRef(null);

  // Initialize CodeMirror and fetch initial code
  useEffect(() => {
    const init = async () => {
      const editor = CodeMirror.fromTextArea(
        document.getElementById("realtimeEditor"),
        {
          mode: { name: "javascript", json: true },
          theme: "dracula",
          autoCloseTags: true,
          autoCloseBrackets: true,
          lineNumbers: true,
          scrollbarStyle: null,
          lineWrapping: true,
        }
      );
      editorRef.current = editor;
      editor.setSize(null, "100%");

      // Handle editor changes
      editor.on("change", (instance, changes) => {
        const { origin } = changes;
        const code = instance.getValue();
        onCodeChange(code);
        if (origin !== "setValue") {
          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code,
          });
        }
      });

      // Fetch code from DB
      try {
        const response = await axios.get(
          `http://localhost:5000/download/${roomId}`
        );
        if (response.status === 200 && response.data) {
          editor.setValue(response.data);
        } else {
          console.log("Room has no code or doesn't exist.");
        }
      } catch (err) {
        console.error("Error fetching code:", err);
      }
    };

    init();
  }, [roomId, socketRef, onCodeChange]);

  // Listen for incoming code updates from server
  useEffect(() => {
    const currentSocket = socketRef.current;
    if (currentSocket) {
      const onCodeUpdate = ({ code }) => {
        if (code !== null && code !== editorRef.current.getValue()) {
          editorRef.current.setValue(code);
        }
      };
      currentSocket.on(ACTIONS.CODE_CHANGE, onCodeUpdate);

      return () => {
        currentSocket.off(ACTIONS.CODE_CHANGE, onCodeUpdate);
      };
    }
  }, [socketRef]);

  return (
    <div style={{ height: "750px", overflow: "hidden" }}>
      <textarea id="realtimeEditor"></textarea>
    </div>
  );
}

export default Editor;
