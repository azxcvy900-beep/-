import express from "express";
import * as admin from 'firebase-admin';

// Initialize Firebase Admin (Using a placeholder for the service account for security.
// The user will need to set an environment variable or local file in their real deployment).
try {
    // We use the GOOGLE_APPLICATION_CREDENTIALS environment variable
    // or default app initialization if running on GCP/Firebase Functions.
    if (!admin.apps.length) {
        admin.initializeApp();
    }
} catch (e) {
    console.log('Firebase admin init error:', e);
}

const db = admin.firestore();

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
    try {
        const { uid, clothingImageBase64, config } = req.body;

        if (!uid) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: "User not found" });
        }

        const userData = userDoc.data();
        if (!userData || userData.credits <= 0) {
            return res.status(403).json({ error: "Insufficient credits. Please upgrade your plan." });
        }

        // --- MOCK GEMINI CALL (Replace with real Gemini API call) ---
        // Here we simulate the AI generation delay and return the image.
        // If this simulated call fails, the credit deduction below WILL NOT run.
        await new Promise(resolve => setTimeout(resolve, 2000));
        const generatedImage = clothingImageBase64;

        // --- ONLY IF SUCCESSFUL: Deduct credit ---
        await userRef.update({
            credits: admin.firestore.FieldValue.increment(-1),
            totalGenerations: admin.firestore.FieldValue.increment(1)
        });

        res.json({ result: generatedImage, remainingCredits: userData.credits - 1 });
    } catch (error: any) {
        console.error("Generation error:", error);
        // Important: Notice we do NOT deduct credits in this Catch block.
        res.status(500).json({ error: "Generation failed. No credits were deducted." });
    }
});

export default app;
