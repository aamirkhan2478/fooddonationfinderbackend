import express from "express";
import cors from "cors";
import connection from "./src/database/connection.mjs";
import userRouter from "./src/routes/user.routes.mjs";
import donationRouter from "./src/routes/donation.routes.mjs";
import itemRouter from "./src/routes/item.routes.mjs";
import { errorHandler, notFound } from "./src/middleware/error.middleware.mjs";

// Initialize express
const app = express();

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
app.use("/api/donation", donationRouter);
app.use("/api/item", itemRouter);

app.use(notFound);
app.use(errorHandler);

// Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
