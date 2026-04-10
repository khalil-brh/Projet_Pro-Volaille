let io;

module.exports = {
    init(server) {
        const { Server } = require("socket.io");
        io = new Server(server, {
            cors: {
                origin: [
                    "https://www.provolaille.com/",
                    "https://provolaille.com/"
                ],
                methods: ["GET", "POST"],
                credentials: true,
            },
        });

        io.on("connection", (socket) => {
            console.log("Admin connected:", socket.id);

            socket.on("disconnect", () => {
                console.log("Admin disconnected:", socket.id);
            });
        });

        return io;
    },

    getIO() {
        if (!io) {
            throw new Error("Socket.io not initialized");
        }
        return io;
    },
};
