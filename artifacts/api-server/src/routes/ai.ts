import { Router, type IRouter } from "express";
import { GoogleGenAI } from "@google/genai";

const router: IRouter = Router();

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY ?? "dummy",
  baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
});

router.post("/ai/improve-description", async (req, res): Promise<void> => {
  const { text } = req.body as { text?: string };

  if (!text || text.trim().length < 5) {
    res.status(400).json({ error: "Text zu kurz." });
    return;
  }

  try {
    const prompt = `Schreibe folgenden Text für einen exklusiven Marktplatz namens "Die kleine Börse" um. Stil: Minimalistisch, elegant, hochwertig, Fokus auf Qualität und Seltenheit. Keine Marktschreierei, keine Ausrufezeichen, keine übertriebenen Adjektive. Klinge wie ein Katalogtext von Sotheby's oder einem Schweizer Uhrenhändler. Gib NUR den umgeschriebenen Text zurück, ohne Erklärungen oder Anmerkungen. Text:\n\n${text.trim()}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 8192 },
    });

    const improved = response.text ?? text;
    res.json({ improved });
  } catch (err: any) {
    console.error("Gemini AI error:", err?.message ?? err);
    res.status(500).json({ error: "KI-Veredelung fehlgeschlagen." });
  }
});

export default router;
