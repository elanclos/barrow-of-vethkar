// Vercel serverless function backing "Connect cloud AI" in barrow.html.
//
// The rules engine has already decided everything that happened before
// this is ever called — dice, damage, hits, finds, deaths are all final
// by the time a request reaches here. All this does is reword the plain
// mechanical outcome into a couple of sentences of atmospheric prose via
// Groq's free-tier chat API. It cannot change the outcome; it only sees
// the already-locked text and hands back new text.
//
// Requires one environment variable, set in the Vercel project's
// Settings -> Environment Variables (never committed to the repo):
//   GROQ_API_KEY   — a free key from https://console.groq.com/keys
//
// Optional second variable for very light abuse resistance — the game's
// client sends a fixed header ("x-barrow-key: barrow-of-vethkar") on every
// call. Since this is a public static page, anyone reading the source can
// see that value too, so this is not real security — it only stops casual
// bots that hit random /api/* paths without reading the page first. The
// hard backstop against abuse is Groq's own account-wide free-tier rate
// limit, which nothing here can exceed no matter who is calling it.
//   NARRATE_CLIENT_KEY = barrow-of-vethkar   (optional; omit to skip the check)

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const requiredClientKey = process.env.NARRATE_CLIENT_KEY;
  if (requiredClientKey && req.headers["x-barrow-key"] !== requiredClientKey) {
    res.status(403).json({ error: "forbidden" });
    return;
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    res.status(500).json({ error: "not_configured" });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const text = typeof body.text === "string" ? body.text.slice(0, 800).trim() : "";
  const context = typeof body.context === "string" ? body.context.slice(0, 80) : "the barrow";

  if (!text) {
    res.status(400).json({ error: "missing_text" });
    return;
  }

  const sys = `You are narrating a grim, restrained fantasy dungeon crawl.
You will be given the MECHANICAL OUTCOME of a turn. It is already final and true.
Rewrite it as 2-3 sentences of atmospheric prose. Rules:
- Never change, soften, or add to the outcome. Damage, hits, misses and finds are fixed.
- Never invent items, exits, or creatures. Keep every character name exactly as given.
- Never roll dice or state numbers. No preamble. Prose only.
Scene: ${context}.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: text },
        ],
        temperature: 0.8,
        max_tokens: 220,
      }),
      signal: controller.signal,
    });

    if (!groqRes.ok) {
      res.status(502).json({ error: "upstream_error" });
      return;
    }

    const j = await groqRes.json();
    const reworded = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || "").trim();
    if (!reworded) {
      res.status(502).json({ error: "empty_response" });
      return;
    }
    res.status(200).json({ text: reworded.slice(0, 1000) });
  } catch (err) {
    res.status(504).json({ error: "timeout_or_network" });
  } finally {
    clearTimeout(timeout);
  }
};
