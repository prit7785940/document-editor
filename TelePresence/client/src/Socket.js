import { io } from "socket.io-client";

export const initSocket = async () => {
  const options = {
    "force new connection": true,
    reconnectionAttempts: "Infinity",
    timeout: 10000,
    transports: ["websocket"],
  };

  const URL = process.env.REACT_APP_BACKEND_URL;
  console.log("🌐 Connecting to:", URL); // Optional debug log

  return io(URL, options);
};
