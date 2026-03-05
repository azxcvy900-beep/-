import { GoogleGenerativeAI } from "@google/generative-ai";
const apiKey = "AIzaSyAiLHSq0c-7N5vaoJiQlvBGSFyqaefPfhc"; // from .env
const genAI = new GoogleGenerativeAI(apiKey);
async function run() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent("hello");
        console.log("Success with 2.5!");
    } catch (err) {
        console.error("Error with 2.5:", err.message);
    }

    try {
        const model2 = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result2 = await model2.generateContent("hello");
        console.log("Success with 2.0!");
    } catch (err) {
        console.error("Error with 2.0:", err.message);
    }
}
run();
