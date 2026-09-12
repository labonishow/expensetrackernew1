const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function buildPrompt(description) {
    return `I am building an expense tracker app. Give one simple, common expense category word (like Food, Travel, Rent, Shopping, Health, Entertainment, Utilities, Salary) for this expense description. Do not use descriptive phrases, just the single category word. Reply with only the category, nothing else.\nExpense: "${description}"`;
}

async function callGemini(prompt) {
    return ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 0 }
        }
    });
}

const getCategorySuggestion = async (req, res) => {
    try {
        const { description } = req.query;

        if (!description) {
            return res.status(400).json({ success: false, message: "Description is required" });
        }

        const prompt = buildPrompt(description);

        let response;
        try {
            response = await callGemini(prompt);
        } catch (err) {
            if (err.status === 503) {
                await new Promise((resolve) => setTimeout(resolve, 800));
                response = await callGemini(prompt);
            } else {
                throw err;
            }
        }

        const category = (response.text || "").trim() || "Other";

        res.status(200).json({
            success: true,
            category
        });

    } catch (err) {
        console.log("AI suggestion error:", err.message || err);
        if (err.status === 503) {
            return res.status(200).json({
                success: true,
                category: "Other",
                message: "AI is busy right now, defaulted to 'Other'"
            });
        }

        res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

module.exports = { getCategorySuggestion };