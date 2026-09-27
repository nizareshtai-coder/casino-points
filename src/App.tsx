import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  points: number;
};

const API = "http://localhost:4000";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [bet, setBet] = useState(50);
  const [slots, setSlots] = useState(["🍒", "7", "⭐"]);
  const [message, setMessage] = useState("Welcome to the casino");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const createUser = async () => {
      try {
        const res = await fetch(`${API}/api/user/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Player One" })
        });

        if (!res.ok) {
          throw new Error("Failed to create user");
        }

        const data = await res.json();
        setUser(data);
      } catch (error) {
        console.error("Failed to create user:", error);
        setMessage("Server not running. Start the backend first.");
      } finally {
        setLoading(false);
      }
    };

    createUser();
  }, []);

  const playSlots = async () => {
    if (!user) return;

    try {
      const res = await fetch(`${API}/api/game/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, bet })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Error");
        return;
      }

      setSlots(data.reels);
      setMessage(data.win ? `You won ${data.payout} points!` : `You lost ${bet} points`);
      setUser((prev) => (prev ? { ...prev, points: data.balance } : prev));
    } catch (error) {
      console.error("Play slots failed:", error);
      setMessage("Connection error. Check backend server.");
    }
  };

  return (
    <div className="page">
      <div className="casino-shell">
        <header className="topbar">
          <div>
            <h1>🎰 Casino Points</h1>
            <p>Play with points, not real money</p>
          </div>

          <div className="balance">{loading ? "Loading..." : `${user?.points ?? 0} points`}</div>
        </header>

        <section className="reels">
          {slots.map((slot, index) => (
            <div key={index} className="reel">
              {slot}
            </div>
          ))}
        </section>

        <div className="controls">
          <label htmlFor="bet">Bet:</label>
          <input
            id="bet"
            type="number"
            value={bet}
            min={10}
            step={10}
            onChange={(e) => setBet(Number(e.target.value))}
          />
          <button onClick={playSlots}>Spin</button>
        </div>

        <div className="message">{message}</div>

        <div className="cards">
          <div className="card">
            <span>🎲 Dice</span>
            <small>Coming soon</small>
          </div>
          <div className="card">
            <span>🃏 Blackjack</span>
            <small>Coming soon</small>
          </div>
          <div className="card">
            <span>🎡 Roulette</span>
            <small>Coming soon</small>
          </div>
        </div>
      </div>
    </div>
  );
}
