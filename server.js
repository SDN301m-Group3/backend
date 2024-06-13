const express = require("express");
const morgan = require("morgan");
const createError = require("http-errors");
const db = require("./models");

const { AuthRouter, GroupRouter, AlbumRouter } = require("./routes");

const { JwtConfig } = require("./configs");

require("dotenv").config();

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Demo data
const users = [
  { id: 1, name: "Alex" },
  { id: 2, name: "Max" },
  { id: 3, name: "Hagard" },
];

app.get("/", JwtConfig.verifyAccessToken, async (req, res, next) => {
  res.send("Hello from express");
});

app.get("/users", JwtConfig.verifyAccessToken, async (req, res, next) => {
  res.send(users);
});

app.use("/auth", AuthRouter);
app.use("/groups", GroupRouter);
app.use("/albums", AlbumRouter);

app.use(async (req, res, next) => {
  next(createError.NotFound());
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  });
});

const PORT = process.env.PORT || 9999;
const HOST_NAME = process.env.HOST_NAME || "localhost";

app.listen(PORT, HOST_NAME, () => {
  console.log(`Server is running at: http://${HOST_NAME}:${PORT}`);
  db.connectDb();
});
