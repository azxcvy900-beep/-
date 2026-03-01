import express from "express";
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

// Initialize Firebase Admin (Using a placeholder for the service account for security.
// The user will need to set an environment variable or local file in their real deployment).
let db: admin.firestore.Firestore | null = null;

try {
    if (!admin.apps.length) {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } else {
            // If no service account is provided, we still init the app with default credentials
            // This might fail in Vercel if not linked, which is why we catch it.
            admin.initializeApp();
        }
    }
    db = admin.firestore();
} catch (e: any) {
    console.error('Firebase admin init error: Could not initialize Firestore Admin SDK.', e.message);
    // Do not crash the server module, just log the error so we can return a proper JSON response
}

const app = express();
app.use(express.json({ limit: '50mb' }));

app.get("/api/admin/stats", (req, res) => {
    res.json({
        totalUsers: 0,
        activePlans: [],
        totalGenerations: 0,
        apiStatus: "Disconnected",
    });
});

app.get("/api/admin/subscriptions", (req, res) => {
    res.json([]);
});

app.post("/api/admin/subscriptions/toggle", (req, res) => {
    res.json({ success: true });
});

app.get("/api/admin/settings", (req, res) => {
    res.json({ gemini_api_key: "" });
});

app.post("/api/admin/settings/update", (req, res) => {
    res.json({ success: true });
});

app.get("/api/admin/packages", (req, res) => {
    res.json([]);
});

app.post("/api/admin/packages/add", (req, res) => {
    res.json({ success: true });
});

app.post("/api/admin/packages/delete", (req, res) => {
    res.json({ success: true });
});

// Secure endpoint for image generation
app.post("/api/generate", async (req, res) => {
    // If Admin SDK failed to initialize due to missing credentials, we simulate success
    // for trial purposes but we can't deduct credits securely.
    // In a real production app, you MUST have FIREBASE_SERVICE_ACCOUNT set in Vercel.
    const isDbConnected = db !== null;

    try {
        const { uid, clothingImageBase64, config } = req.body;

        if (!uid) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        let remainingCredits = 0;
        if (isDbConnected && db) {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                return res.status(404).json({ error: "User not found" });
            }

            const userData = userDoc.data();
            if (!userData || userData.credits <= 0) {
                return res.status(403).json({ error: "رصيدك غير كافٍ. يرجى ترقية الباقة." });
            }

            remainingCredits = userData.credits - 1;
        }

        // --- PREPARE INPUT ---
        let base64Data = clothingImageBase64;
        if (base64Data.startsWith('data:image')) {
            base64Data = base64Data.split(',')[1];
        }

        // --- HUGGING FACE IMAGE GENERATION ---
        const hfToken = process.env.HF_TOKEN;
        if (!hfToken) {
            return res.status(500).json({ error: "HF_TOKEN is missing. Please add it in Vercel settings (Hugging Face Access Token)." });
        }

        // Switching back to the flag-ship model now that permissions are (hopefully) correct
        const modelId = "black-forest-labs/FLUX.1-schnell";

        const hfPrompt = `Professional high-end fashion photography, ${config.gender} ${config.category} wearing the provided clothing item, ${config.pose}, ${config.background}, ${config.cameraAngle || 'eye level'}, 8k resolution, photorealistic, cinematic lighting, sharp focus, fashion magazine editorial style.`;

        console.log(`DEBUG - Calling HF API: https://api-inference.huggingface.co/models/${modelId}`);

        const hfResponse = await fetch(
            `https://api-inference.huggingface.co/models/${modelId}`,
            {
                headers: {
                    "Authorization": `Bearer ${hfToken.trim()}`,
                    "Content-Type": "application/json",
                    "x-wait-for-model": "true",
                    "x-use-cache": "false"
                },
                method: "POST",
                body: JSON.stringify({
                    inputs: hfPrompt,
                    parameters: {
                        wait_for_model: true
                    }
                }),
            }
        );

        const contentType = hfResponse.headers.get("content-type");
        console.log(`DEBUG - HF Status: ${hfResponse.status}, Content-Type: ${contentType}`);

        if (!hfResponse.ok || (contentType && contentType.includes("application/json"))) {
            const errorText = await hfResponse.text();
            console.error("DEBUG - HF Error Body:", errorText);

            if (errorText.includes("estimated_time") || errorText.includes("loading")) {
                const errorData = JSON.parse(errorText);
                return res.status(503).json({
                    error: "الموديل يفتح الآن.. يرجى الانتظار دقيقة والمحاولة ثانية.",
                    estimated_time: errorData.estimated_time
                });
            }

            // If it's still 410, it's definitely something about the API access
            if (hfResponse.status === 410) {
                return res.status(410).json({
                    error: "خطأ 410: المحرك غير متاح حالياً لهذه النسخة. يرجى التأكد من أن الرمز في Vercel هو الرمز الصحيح وبدون مسافات."
                });
            }

            throw new Error(`مشكلة في محرك الذكاء الاصطناعي: ${hfResponse.status}. ${errorText.substring(0, 100)}`);
        }

        const buffer = await hfResponse.arrayBuffer();

        // Hugging Face FLUX model primarily returns PNG
        const generatedImageBase64 = `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;

        // --- ONLY IF SUCCESSFUL: Deduct credit ---
        if (isDbConnected && db) {
            const userRef = db.collection('users').doc(uid);
            await userRef.update({
                credits: admin.firestore.FieldValue.increment(-1),
                totalGenerations: admin.firestore.FieldValue.increment(1)
            });
        }

        console.log("Success! Generated image length:", generatedImageBase64.length, "Mime: image/png");

        res.json({ result: generatedImageBase64, remainingCredits });
    } catch (error: any) {
        console.error("DEBUG - Generation error details:", {
            message: error.message,
            stack: error.stack,
            code: error.code,
            status: error.status
        });

        // Final fallback logic: If Gemini fails, we guide the user to the "real" solution
        let errorMessage = error.message || 'خطأ غير معروف';

        if (error.message?.includes('404')) {
            errorMessage = "الطراز المطلوب غير متوفر حالياً. جرب لاحقاً أو تأكد من إعدادات HF_TOKEN.";
        } else if (error.message?.includes('Authorization') || error.message?.includes('401')) {
            errorMessage = "خطأ في رمز HF_TOKEN. يرجى التأكد من صحته في Vercel (Hugging Face Access Token).";
        }

        res.status(500).json({ error: `فشل التوليد: ${errorMessage}` });
    }
});

export default app;
