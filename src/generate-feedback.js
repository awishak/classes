export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch (e) {
        return res.status(400).json({ error: "Invalid JSON body" });
      }
    }

    const prompt = body?.prompt;
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    // Build messages array
    let content;
    if (body.image && body.mediaType) {
      // Image + text prompt
      content = [
        { type: "image", source: { type: "base64", media_type: body.mediaType, data: body.image } },
        { type: "text", text: prompt },
      ];
    } else {
      content = prompt;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || data });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Server error: " + err.message });
  }
}
