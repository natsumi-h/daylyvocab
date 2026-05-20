"use client";

import { useState, useCallback } from "react";

interface VocabEntry {
  word: string;
  meaning: string;
  priority: "highest" | "high" | "";
  tags: string[];
  mastered: boolean;
}

interface CardData {
  word: string;
  japanese_meaning: string;
  example_en: string;
  example_ja: string;
  similar: { expr: string; note: string }[];
  tip: string;
}

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

async function fetchVocabFromNotion(): Promise<VocabEntry[]> {
  const res = await fetch("/api/vocab");
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Notion APIエラー");
  }
  return res.json();
}

async function generateCards(words: VocabEntry[]): Promise<CardData[]> {
  const res = await fetch("/api/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ words }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Claude APIエラー");
  }

  return res.json();
}

// ── Card ──────────────────────────────────────────────────────
function Card({
  entry,
  cardData,
  index,
}: {
  entry: VocabEntry;
  cardData: CardData | null;
  index: number;
}) {
  const tagStyle: Record<string, { bg: string; color: string }> = {
    Work: { bg: "#e8f4fd", color: "#2980b9" },
    Daily: { bg: "#fef9e7", color: "#c8960c" },
  };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "16px",
        padding: "26px 30px",
        marginBottom: "18px",
        boxShadow: "0 2px 14px rgba(0,0,0,0.06)",
        borderLeft: `4px solid ${entry.priority === "highest" ? "#8e44ad" : entry.priority === "high" ? "#e74c3c" : "#dde1e7"}`,
        animation: "fadeIn 0.35s ease both",
        animationDelay: `${index * 0.05}s`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "8px",
        }}
      >
        <span
          style={{ fontSize: "12px", color: "#ccc", fontFamily: "monospace" }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span
          style={{
            fontSize: "21px",
            fontWeight: "700",
            color: "#1a1a2e",
            fontFamily: "Georgia, serif",
          }}
        >
          {entry.word}
        </span>
        {entry.priority === "highest" && (
          <span
            style={{
              fontSize: "10px",
              background: "#f5eef8",
              color: "#8e44ad",
              padding: "2px 8px",
              borderRadius: "20px",
              fontFamily: "sans-serif",
              fontWeight: "700",
              letterSpacing: "0.5px",
            }}
          >
            HIGHEST
          </span>
        )}
        {entry.priority === "high" && (
          <span
            style={{
              fontSize: "10px",
              background: "#fdecea",
              color: "#e74c3c",
              padding: "2px 8px",
              borderRadius: "20px",
              fontFamily: "sans-serif",
              fontWeight: "700",
              letterSpacing: "0.5px",
            }}
          >
            HIGH
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
        {entry.tags.length > 0 ? (
          entry.tags.map((t) => (
            <span
              key={t}
              style={{
                fontSize: "11px",
                padding: "2px 10px",
                borderRadius: "20px",
                background: tagStyle[t]?.bg || "#f0f0f0",
                color: tagStyle[t]?.color || "#888",
                fontFamily: "sans-serif",
                fontWeight: "600",
              }}
            >
              {t}
            </span>
          ))
        ) : (
          <span
            style={{
              fontSize: "11px",
              color: "#ccc",
              fontFamily: "sans-serif",
            }}
          >
            No tag
          </span>
        )}
      </div>

      {!cardData ? (
        <div
          style={{ color: "#ccc", fontFamily: "sans-serif", fontSize: "14px" }}
        >
          <span
            style={{
              display: "inline-block",
              animation: "spin 1s linear infinite",
              marginRight: "6px",
            }}
          >
            ⏳
          </span>
          生成中...
        </div>
      ) : (
        <>
          <div
            style={{
              fontStyle: "italic",
              color: "#777",
              fontSize: "15px",
              fontFamily: "Georgia, serif",
              marginBottom: "14px",
            }}
          >
            {cardData.japanese_meaning}
          </div>

          <div
            style={{
              background: "#f8f9fa",
              borderRadius: "10px",
              padding: "14px 16px",
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#bbb",
                fontFamily: "sans-serif",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              📝 Example
            </div>
            <div
              style={{
                fontSize: "15px",
                color: "#2c3e50",
                lineHeight: "1.7",
                fontFamily: "Georgia, serif",
                marginBottom: "6px",
              }}
            >
              &quot;{cardData.example_en}&quot;
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "#888",
                fontFamily: "sans-serif",
              }}
            >
              {cardData.example_ja}
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <div
              style={{
                fontSize: "11px",
                color: "#bbb",
                fontFamily: "sans-serif",
                marginBottom: "7px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              🔀 Similar
            </div>
            {(cardData.similar || []).map((s, i) => (
              <div
                key={i}
                style={{
                  fontSize: "13px",
                  marginBottom: "5px",
                  fontFamily: "sans-serif",
                }}
              >
                <span style={{ fontWeight: "700", color: "#34495e" }}>
                  {s.expr}
                </span>
                <span style={{ color: "#aaa", marginLeft: "7px" }}>
                  — {s.note}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              fontSize: "13px",
              color: "#16a085",
              background: "#eafaf1",
              borderRadius: "8px",
              padding: "10px 14px",
              fontFamily: "sans-serif",
            }}
          >
            💡 {cardData.tip}
          </div>
        </>
      )}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase] = useState<
    "idle" | "fetching" | "generating" | "done" | "error"
  >("idle");
  const [msg, setMsg] = useState("");
  const [entries, setEntries] = useState<VocabEntry[]>([]);
  const [cards, setCards] = useState<(CardData | null)[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState("");

  const run = useCallback(async () => {
    setPhase("fetching");
    setMsg("Notionから単語を取得中...");
    setEntries([]);
    setCards([]);
    setError("");
    setTotal(null);

    try {
      const all = await fetchVocabFromNotion();
      const unmastered = all.filter((e) => !e.mastered && e.word);
      setTotal(unmastered.length);

      if (unmastered.length === 0)
        throw new Error("未マスターの単語が見つかりませんでした。");

      const highest = shuffle(unmastered.filter((e) => e.priority === "highest"));
      const high = shuffle(unmastered.filter((e) => e.priority === "high"));
      const normal = shuffle(unmastered.filter((e) => e.priority !== "highest" && e.priority !== "high"));
      const selected = [...highest, ...high, ...normal].slice(0, 10);
      setEntries(selected);

      setPhase("generating");
      setMsg("例文・類語を生成中...");

      const generated = await generateCards(selected);
      console.log(generated);
      setCards(selected.map((_, i) => generated[i] ?? null));
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setPhase("error");
    }
  }, []);

  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,#f0f4f8,#e8ecf1)",
        padding: "40px 16px 80px",
      }}
    >
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        button:hover{opacity:0.85}
      `}</style>

      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div
            style={{
              fontSize: "11px",
              color: "#bbb",
              fontFamily: "sans-serif",
              letterSpacing: "3px",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            {today}
          </div>
          <h1
            style={{
              fontSize: "30px",
              fontWeight: "700",
              color: "#1a1a2e",
              fontFamily: "Georgia, serif",
              margin: "0 0 6px",
            }}
          >
            📚 Daily Vocabulary
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "#aaa",
              fontFamily: "sans-serif",
              margin: 0,
            }}
          >
            Notionデータベースからランダムに10語
          </p>
          {total !== null && (
            <p
              style={{
                fontSize: "12px",
                color: "#bbb",
                fontFamily: "sans-serif",
                marginTop: "4px",
              }}
            >
              未マスター: {total}語
            </p>
          )}
        </div>

        {phase === "idle" && (
          <div style={{ textAlign: "center" }}>
            <button
              onClick={run}
              style={{
                background: "#1a1a2e",
                color: "#fff",
                border: "none",
                borderRadius: "14px",
                padding: "18px 48px",
                fontSize: "15px",
                fontFamily: "sans-serif",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 6px 24px rgba(26,26,46,0.18)",
              }}
            >
              今日の10語を取得する
            </button>
          </div>
        )}

        {(phase === "fetching" || phase === "generating") && (
          <div
            style={{
              textAlign: "center",
              padding: "48px 0",
              color: "#999",
              fontFamily: "sans-serif",
            }}
          >
            <div
              style={{
                fontSize: "36px",
                animation: "spin 1.2s linear infinite",
                display: "inline-block",
                marginBottom: "14px",
              }}
            >
              ⏳
            </div>
            <div style={{ fontSize: "15px" }}>{msg}</div>
          </div>
        )}

        {phase === "error" && (
          <div
            style={{
              background: "#fdecea",
              borderRadius: "14px",
              padding: "24px",
              fontFamily: "sans-serif",
              fontSize: "14px",
              color: "#c0392b",
            }}
          >
            <strong>エラー:</strong> {error}
            <br />
            <br />
            <button
              onClick={run}
              style={{
                background: "#c0392b",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 24px",
                cursor: "pointer",
                fontFamily: "sans-serif",
              }}
            >
              再試行
            </button>
          </div>
        )}

        {(phase === "generating" || phase === "done") &&
          entries.map((entry, i) => (
            <Card
              key={`${entry.word}-${i}`}
              index={i}
              entry={entry}
              cardData={cards[i] || null}
            />
          ))}

        {phase === "done" && (
          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <button
              onClick={run}
              style={{
                background: "transparent",
                color: "#1a1a2e",
                border: "2px solid #1a1a2e",
                borderRadius: "12px",
                padding: "12px 36px",
                fontSize: "14px",
                fontFamily: "sans-serif",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              🔀 別の10語を取得
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
