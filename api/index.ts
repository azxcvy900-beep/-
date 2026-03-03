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

        // --- REPLICATE IMAGE GENERATION ---
        const replicateToken = process.env.REPLICATE_API_TOKEN || "";

        if (!replicateToken) {
            console.error("DEBUG - REPLICATE_API_TOKEN is missing in process.env");
            return res.status(500).json({ error: "Replicate token is missing. Please add REPLICATE_API_TOKEN in Vercel settings." });
        }

        console.log(`DEBUG - Calling Replicate API for IDM-VTON (Virtual Try-On)`);

        // Add the base prefix if missing because Replicate expects full data URI
        const garmImageUri = clothingImageBase64.startsWith('data:')
            ? clothingImageBase64
            : `data:image/jpeg;base64,${clothingImageBase64}`;

        // Define default models based on gender and category if the user didn't upload one
        let humanImageUri = config.modelImage;
        if (humanImageUri && !humanImageUri.startsWith('data:')) {
            humanImageUri = `data:image/jpeg;base64,${humanImageUri}`;
        }

        if (!humanImageUri) {
            // Default models mapped from realistic unsplash/stock images or base64. 
            // We use direct replicate file URLs or public URLs for safety.
            if (config.gender === 'أطفال') {
                humanImageUri = "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"; // Boy
            } else if (config.gender === 'ذكر') {
                humanImageUri = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"; // Adult Male
            } else {
                humanImageUri = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"; // Adult Female
            }
        }

        const replicateResponse = await fetch(
            `https://api.replicate.com/v1/predictions`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${replicateToken}`,
                    "Content-Type": "application/json",
                    "Prefer": "wait"
                },
                body: JSON.stringify({
                    version: "c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4", // IDM-VTON latest version
                    input: {
                        crop: false,
                        seed: Math.floor(Math.random() * 2147483647),
                        steps: 30,
                        category: config.category === 'سفلي' ? "lower_body" : config.category === 'فساتين' ? "dresses" : "upper_body",
                        force_dc: false,
                        garm_img: garmImageUri,
                        human_img: humanImageUri,
                        mask_only: false,
                        garment_des: `High-quality ${config.category} clothing item`,
                        disable_safety_checker: true
                    }
                }),
            }
        );

        let replicateData = await replicateResponse.json();
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

        // Add polling mechanism in case Replicate returns early with "starting" or "processing" status
        while (replicateData.status === "starting" || replicateData.status === "processing") {
            console.log(`DEBUG - Polling Replicate... Status is ${replicateData.status}`);
            await new Promise(resolve => setTimeout(resolve, 2500)); // Wait 2.5 seconds
            if (!replicateData.urls || !replicateData.urls.get) {
                console.log("DEBUG - No polling URL provided by Replicate.");
                break;
            }
            const pollResponse = await fetch(replicateData.urls.get, {
                headers: {
                    "Authorization": `Bearer ${replicateToken}`,
                }
            });
            replicateData = await pollResponse.json();
        }

        // Replicate returns an array of image URLs in `output`
        if (!replicateData.output || !Array.isArray(replicateData.output) || replicateData.output.length === 0) {
            console.error("DEBUG - Replicate Output Empty or Failed. Final Status:", replicateData.status, "Error:", replicateData.error);
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

        if (errorMessage.includes('NSFW content')) {
            errorMessage = "عذراً، نظام الحماية التلقائي في محرك الذكاء الاصطناعي حجب التوليد. يرجى تجربة صورة أخرى للملابس أو العارض لا تتضمن كشف زائد للبشرة.";
        } else if (errorMessage.includes('401') || errorMessage.includes('Payment')) {
            errorMessage = "المفتاح غير مفعل. تحتاج لإضافة بطاقة بنكية في حساب Replicate ليعمل بصورة صحيحة.";
        }

        res.status(500).json({ error: `فشل التوليد: ${errorMessage}` });
    }
});

export default app;
