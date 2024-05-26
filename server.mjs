import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import connection from "./src/database/connection.mjs";
import userRouter from "./src/routes/user.routes.mjs";
import donationRouter from "./src/routes/donation.routes.mjs";
import chatRouter from "./src/routes/chat.routes.mjs";
import messageRouter from "./src/routes/message.routes.mjs";
import contactRouter from "./src/routes/contact.routes.mjs";
import volunteerRouter from "./src/routes/volunteer.routes.mjs";
import { errorHandler, notFound } from "./src/middleware/error.middleware.mjs";
import auth from "./src/middleware/auth.middleware.mjs";

// Initialize express
const app = express();

// Initialize socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

//Database Connection
connection();

// Starting endpoint
app.get("/", (_req, res) => {
  res.send("<h1 style='color:green;'>Hurrah! Server is running.</h1>");
});

// Routes
app.use("/api/user", userRouter);
app.use("/api/donation", auth, donationRouter);
app.use("/api/chat", auth, chatRouter);
app.use("/api/message", auth, messageRouter);
app.use("/api/contact", contactRouter);
app.use("/api/volunteer", volunteerRouter);

app.use(notFound);
app.use(errorHandler);

// Socket.io
io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  /*
  - This is a socket.io event listener that listens for the "setup" event.
  - When it hears the "setup" event, it joins the socket to a room with the
  - name of the user's id.
  - It then emits the "connected" event to the socket.
*/
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  /* 
   - This is a socket.io event listener that listens for a "join chat" event.
   - When it hears that event, it joins the room that is passed in.
   - It then logs a message to the console.
  */
  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User joined chat:" + room);
  });

  // This is a socket.io event listener that listens for a "typing" event.
  socket.on("typing", (room) => socket.in(room).emit("typing"));

  // This is a socket.io event listener that listens for a "stop typing" event.
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  // This is a socket.io event listener that listens for a "new message" event.
  socket.on("new message", (newMessageReceived) => {
    var chat = newMessageReceived.chat;

    if (!chat.users) return console.log("chat.users is not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageReceived.sender._id) return;

      socket.in(user._id).emit("message received", newMessageReceived);
    });
  });

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});

// Server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
