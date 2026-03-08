import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

async function testGeminiHelper() {
    if (!geminiKey) {
        console.error("No Gemini Key found in .env");
        return;
    }

    const pass = { description: "Navy blue tailored suit jacket" };
    const config = {
        gender: "male",
        category: "adults",
        pose: "walking confidently down a city street",
        background: "busy Tokyo street at night, neon lights"
    };

    console.log("Testing generation with:", { pass, config });

    try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const basePrompt = `Act as an expert Fashion Photography Director and AI Prompt Engineer.
We need a highly detailed, professional prompt for an AI Virtual Try-On system (IDM-VTON) to generate a realistic product photo.

GARMENT DESCRIPTION: ${pass.description}
TARGET MODEL: ${config.gender === 'male' ? 'Male' : 'Female'}, ${config.category === 'kids' ? 'child' : config.category === 'youth' ? 'teenager' : 'adult'}
REQUESTED POSE/VIBE: ${config.pose || 'standing straight, professional'}
REQUESTED BACKGROUND: ${config.background || 'clean studio background'}

INSTRUCTIONS:
1. Write a single, cohesive, highly descriptive paragraph describing the model wearing the garment in the specified pose and background.
2. Enhance the description with professional photography terms (e.g., "8k resolution", "cinematic lighting", "photorealistic", "ultra-detailed", "Vogue editorial style", "perfect skin texture").
3. DO NOT include introductory or concluding remarks. Just output the prompt itself.
4. Keep it under 100 words.
5. End the prompt with the exact phrase: ", correct proportions, DO NOT crop face."

YOUR GENERATED PROMPT:`;

        const result = await model.generateContent(basePrompt);
        const enhancedPrompt = result.response.text().trim();
        console.log(`\n--- RESULT ---\n${enhancedPrompt}\n`);
    } catch (error) {
        console.error("Test failed.", error);
    }
}

testGeminiHelper();
