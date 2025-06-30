import { io, Socket } from "socket.io-client";
import config from "../config";

const token = localStorage.getItem("token");
const SOCKET_SERVER_URL = config.GUARDIAN_SERVER_URL || "http://localhost:3000";

const socket: Socket = io(SOCKET_SERVER_URL, {
  transports: ["websocket"],
  auth: { token },
});

export default socket;