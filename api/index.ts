import express from "express";
import * as admin from 'firebase-admin';

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

        // --- REPLICATE IMAGE GENERATION ---
        const replicateToken = process.env.REPLICATE_API_TOKEN || "";

        if (!replicateToken) {
            console.error("DEBUG - REPLICATE_API_TOKEN is missing in process.env");
            return res.status(500).json({ error: "Replicate token is missing. Please add REPLICATE_API_TOKEN in Vercel settings." });
        }

        const hfPrompt = `Professional high-end fashion photography, ${config.gender} ${config.category} wearing clothing, ${config.pose}, ${config.background}, ${config.cameraAngle || 'eye level'}, 8k resolution, photorealistic, cinematic lighting, sharp focus, fashion magazine editorial style.`;

        console.log(`DEBUG - Calling Replicate API for FLUX`);

        const replicateResponse = await fetch(
            `https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${replicateToken}`,
                    "Content-Type": "application/json",
                    "Prefer": "wait"
                },
                body: JSON.stringify({
                    input: {
                        prompt: hfPrompt,
                        go_fast: true,
                        megapixels: "1",
                        num_outputs: 1,
                        output_format: "png",
                        output_quality: 100,
                        aspect_ratio: "3:4"
                    }
                }),
            }
        );

        const replicateData = await replicateResponse.json();
        console.log(`DEBUG - Replicate Status: ${replicateResponse.status}`);

        if (!replicateResponse.ok || replicateData.error) {
            console.error("DEBUG - Replicate Error:", replicateData.error || replicateData);

            if (replicateResponse.status === 401) {
                return res.status(401).json({
                    error: "خطأ في مفتاح Replicate. يرجى التأكد من إضافة بطاقة بنكية لحسابك أو صحة الرمز في Vercel."
                });
            }

            throw new Error(`مشكلة في محرك Replicate: ${replicateData.error || replicateResponse.statusText}.`);
        }

        // Replicate returns an array of image URLs in `output`
        if (!replicateData.output || !Array.isArray(replicateData.output) || replicateData.output.length === 0) {
            console.error("DEBUG - Replicate Output Empty:", replicateData);
            throw new Error(replicateData.error || "المحتوى غير لائق أو النظام لم يتمكن من التوليد.");
        }

        const imageUrl = replicateData.output[0];

        // Fetch the generated image url and convert it to Base64 to retain the format the frontend expects
        const imageResponse = await fetch(imageUrl);
        const buffer = await imageResponse.arrayBuffer();
        const generatedImageBase64 = `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;

        // --- ONLY IF SUCCESSFUL: Deduct credit ---
        if (isDbConnected && db) {
            const userRef = db.collection('users').doc(uid);
            await userRef.update({
                credits: admin.firestore.FieldValue.increment(-1),
                totalGenerations: admin.firestore.FieldValue.increment(1)
            });
        }

        console.log("Success! Generated image via Replicate.");

        res.json({ result: generatedImageBase64, remainingCredits });
    } catch (error: any) {
        console.error("DEBUG - Generation error details:", {
            message: error.message,
            stack: error.stack,
            code: error.code,
            status: error.status
        });

        // Final fallback logic
        let errorMessage = error.message || 'خطأ غير معروف';

        if (errorMessage.includes('401') || errorMessage.includes('Payment')) {
            errorMessage = "المفتاح غير مفعل. تحتاج لإضافة بطاقة بنكية في حساب Replicate ليعمل بصورة صحيحة.";
        }

        res.status(500).json({ error: `فشل التوليد: ${errorMessage}` });
    }
});

export default app;
