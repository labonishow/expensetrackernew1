const { GoogleGenAI } = require("@google/genai");

// The SDK automatically looks for the process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function buildPrompt(description) {
    return `I am building an expense tracker app. Give one simple, common expense category word (like Food, Travel, Rent, Shopping, Health, Entertainment, Utilities, Salary) for this expense description. Do not use descriptive phrases, just the single category word. Reply with only the category, nothing else.\nExpense: "${description}"`;
}

async function callGemini(prompt) {
    return ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
            // Correct format for passing thinking budget configs in standard generation
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
            // Handle transient 503 Service Unavailable API errors with a quick retry
            if (err.status === 503 || err.statusCode === 503) {
                await new Promise((resolve) => setTimeout(resolve, 800));
                response = await callGemini(prompt);
            } else {
                throw err;
            }
        }

        // Safely extract text from the standard response wrapper
        const category = response && response.text ? response.text.trim() : "Other";

        // Keep it clean. Send a simple string back that matches what frontend maps.
        return res.status(200).json({
            success: true,
            category: category || "Other"
        });

    } catch (err) {
        console.error("AI suggestion error:", err.message || err);
        
        // Graceful fallback so the frontend frontend doesn't break or log out
        return res.status(200).json({
            success: false,
            category: "Other",
            message: "AI is temporarily unavailable. Defaulted to Other."
        });
    }
};

module.exports = { getCategorySuggestion };
