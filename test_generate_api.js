import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from 'node-fetch'; // if needed
import fs from 'fs';
import fs from 'fs';

const GEMINI_API_KEY = "dummy_key_or_real_key_if_env_has_it";

async function testGenerateRoute() {
    try {
        console.log("Sending POST to http://localhost:3000/api/generate...");

        const response = await fetch("http://localhost:3000/api/generate", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uid: "trial_uid",
                variations: 1,
                items: [
                    {
                        base64: "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", // simple 1x1 image
                        description: "Blue cotton t-shirt with a vintage logo",
                        placement: "upper_body"
                    }
                ],
                config: {
                    apiKey: process.env.GEMINI_API_KEY,
                    gender: "male",
                    category: "adults",
                    pose: "standing straight, professional",
                    background: "clean studio background"
                }
            })
        });

        const data = await response.json();
        console.log("Response Status:", response.status);
        if (response.status !== 200) {
            console.error("Error from API:", data);
        } else {
            console.log("Success! Data:", data);
        }

    } catch (err) {
        console.error("Failed to hit API:", err);
    }
}

testGenerateRoute();
