import express from "express";
import cors from "cors";
import "dotenv/config";

import "./database/db.js";

import authRoutes from "./routes/auth.js";

import productRoutes
  from "./routes/products.js";

import memberRoutes
  from "./routes/members.js";

import transactionRoutes
  from "./routes/transactions.js";

import debtRoutes
  from "./routes/debts.js";

import priceRoutes
  from "./routes/prices.js";

import settingsRoutes from "./routes/settings.js";

const app = express();

const PORT = 3000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",

      "http://localhost:5174",
      "http://127.0.0.1:5174",
      "https://pos-slamet.vercel.app/"
    ],

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
    ],

    allowedHeaders: [
      "Content-Type",
    ],
  })
);

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/products",
  productRoutes
);

app.use(
  "/api/members",
  memberRoutes
);

app.use(
  "/api/transactions",
  transactionRoutes
);

app.use(
  "/api/debts",
  debtRoutes
);

app.use(
  "/api/prices",
  priceRoutes
);

app.use(
  "/api/settings",
  settingsRoutes
);

app.get("/", (req, res) => {
  res.json({
    success: true,

    message:
      "Backend POS Toko Sembako berjalan.",

    endpoints: {
      products:
        "/api/products",

      members:
        "/api/members",

      transactions:
        "/api/transactions",

      debts:
        "/api/debts",

      prices:
        "/api/prices",
    },
  });
});

app.listen(
  PORT,
  () => {
    console.log(
      `Backend berjalan di http://localhost:${PORT}`
    );
  }
);