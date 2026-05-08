exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        const playerHP = body.hp;
        const playerMaxHP = body.maxHp;
        const playerGold = body.gold;

        const apiKey = process.env.GEMINI_API_KEY;

        // If the key is completely missing from Netlify, tell us!
        if (!apiKey) {
            return {
                statusCode: 200,
                body: JSON.stringify({ reply: "ERROR: Netlify cannot find the GEMINI_API_KEY variable!" }),
            };
        }

        const systemPrompt = `You are a grumpy but helpful Desert Innkeeper in a 2D RPG. 
        The player currently has ${playerHP} out of ${playerMaxHP} Health, and ${playerGold} Gold. 
        Keep your response to exactly 2 short sentences. 
        Comment on their health or wealth dynamically. Do not offer to heal them.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    { role: "user", parts: [{ text: systemPrompt }] }
                ]
            })
        });

        const data = await response.json();
        
        // --- NEW: CATCH GOOGLE ERRORS ---
        // If Google sends back an error (like an invalid key), print it to the game screen!
        if (data.error) {
            return {
                statusCode: 200,
                body: JSON.stringify({ reply: `GOOGLE ERROR: ${data.error.message}` }),
            };
        }

        const aiText = data.candidates[0].content.parts[0].text;

        return {
            statusCode: 200,
            body: JSON.stringify({ reply: aiText }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ reply: `CRITICAL SERVER ERROR: ${error.message}` }),
        };
    }
};