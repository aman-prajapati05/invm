import type { NextApiRequest, NextApiResponse } from "next";
import { Server as NetServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import type { Server as IOServer } from "socket.io";
import { startNotificationWatcher } from "@/lib/watchNotification";
// Make sure this path is correct

// Add global type augmentation for _io
declare global {
  // eslint-disable-next-line no-var
  var _io: IOServer | undefined;
}

// Extend the Next.js Server to include `io`
interface SocketServer extends NetServer {
  io?: IOServer;
}

interface SocketWithServer {
  socket: {
    server: SocketServer;
  };
}

// Export default handler
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const socketWithServer = res as unknown as SocketWithServer;

  if (!socketWithServer.socket.server.io) {
    console.log("✅ Setting up Socket.IO server...");

    const io = new SocketIOServer(socketWithServer.socket.server as any, {
      path: "/api/socket",
      addTrailingSlash: false,
    });

    socketWithServer.socket.server.io = io;
    global._io = io;

    io.on("connection", (socket: Socket) => {
      console.log("🔌 New client connected:", socket.id);

      socket.on("disconnect", () => {
        console.log("❌ Client disconnected:", socket.id);
      });
    });

    // Start watching MongoDB change stream
    startNotificationWatcher(io).catch((err) => {
      console.error("❌ Failed to start notification watcher:", err);
    });
  }

  res.end();
}
