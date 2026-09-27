import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

type User = {
  id: string;
  name: string;
  points: number;
};

const users: Record<string, User> = {
  guest: { id: "guest", name: "Guest", points: 1000 }
};

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "Casino Points Server is running" });
});

app.get("/api/user/:id", (req, res) => {
  const user = users[req.params.id];
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

app.post("/api/user/create", (req, res) => {
  const { name } = req.body as { name?: string };
  const id = `user_${Date.now()}`;
  users[id] = { id, name: name || "Player", points: 1000 };
  res.json(users[id]);
});

app.post("/api/game/slots", (req, res) => {
  const { userId, bet } = req.body as { userId: string; bet: number };
  const user = users[userId];

  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.points < bet) return res.status(400).json({ error: "Not enough points" });

  const symbols = ["🍒", "7", "💎", "⭐", "🍋"];
  const reels = Array.from({ length: 3 }, () =>
    symbols[Math.floor(Math.random() * symbols.length)]
  );

  let payout = 0;
  const [a, b, c] = reels;
  if (a === b && b === c) payout = bet * 5;
  else if (a === b || b === c || a === c) payout = bet * 2;
  else payout = 0;

  user.points += payout - bet;

  const result = {
    reels,
    win: payout > 0,
    payout,
    balance: user.points
  };

  io.emit("slots:update", { userId, result });
  res.json(result);
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    socket.emit("joined", { userId });
  });
});

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
