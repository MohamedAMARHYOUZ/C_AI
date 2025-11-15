import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");

const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));

app.post("/api/chat", async (req, res) => {
    const { text } = req.body || {};

    if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "Text is required" });
    }

    if (!openaiApiKey || !openai) {
        console.error("OPENAI_API_KEY is missing. Set it in your environment before starting the server.");
        return res.status(500).json({ error: "Server not configured for OpenAI" });
    }

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "You are a helpful assistant that receives cleaned text. Respond with short sections that use clear headings or bullet lists so the answer is easy to scan."
                },
                { role: "user", content: text }
            ]
        });

        const reply = completion.choices?.[0]?.message?.content?.trim() || "";
        return res.json({ reply });
    } catch (error) {
        const errorMessage =
            error?.response?.data?.error?.message ||
            error?.message ||
            "Something went wrong";
        console.error("OpenAI API error:", errorMessage, error?.response?.data || "");
        return res.status(500).json({ error: errorMessage });
    }
});

app.get("*", (req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
