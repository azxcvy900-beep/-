import express from "express";
import * as admin from 'firebase-admin';
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

const generateSchema = z.object({
    uid: z.string().min(1, "UID is required"),
    items: z.array(z.object({
        base64: z.string().optional(),
        description: z.string(),
        placement: z.string()
    })).min(1, "At least one item is required"),
    config: z.object({
        apiKey: z.string().optional(),
        gender: z.string(),
        category: z.string(),
        pose: z.string(),
        background: z.string(),
        cameraAngle: z.string().optional(),
        modelImage: z.string().optional(),
        isFreeTrial: z.boolean().optional()
    })
});

const analyzeSchema = z.object({
    clothingImageBase64: z.string().min(1, "Clothing image is required"),
    apiKey: z.string().optional()
});

app.post("/api/analyze-clothing", async (req, res) => {
    try {
        const validatedBody = analyzeSchema.safeParse(req.body);
        if (!validatedBody.success) {
            return res.status(400).json({ error: "Invalid request data" });
        }

        const { clothingImageBase64, apiKey } = validatedBody.data;
        const geminiKey = apiKey || process.env.GEMINI_API_KEY;

        if (!geminiKey) {
            return res.status(500).json({ error: "Gemini API key is missing. Add it in settings." });
        }

        let mimeType = "image/jpeg";
        let base64Data = clothingImageBase64;

        if (clothingImageBase64.startsWith("data:")) {
            const matches = clothingImageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                mimeType = matches[1];
                base64Data = matches[2];
            }
        }

        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Analyze this image containing clothing or accessories.
Provide a JSON response with the following structure:
{
  "isMultiple": boolean, // true if there are multiple DIFFERENT clothing pieces (e.g. a shirt AND pants, or a suit). false if it's just one piece.
  "pieces": [ // Array of detected pieces
    {
      "description": string, // Short description of the piece
      "placement": "upper_body" | "lower_body" | "dresses" | "shoes" | "bags" | "headwear" | "eyewear" | "jewelry" // Determine the category where this piece is worn.
    }
  ]
}`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType
                }
            }
        ]);

        const text = result.response.text();

        let parsedData;
        try {
            // Robust parsing: extract JSON from markdown or raw text
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
            const cleanText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
            parsedData = JSON.parse(cleanText);
        } catch (parseError) {
            console.error("DEBUG - Gemini JSON Parse failed. Raw text:", text);
            // Fallback for single item if parsing fails completely
            parsedData = {
                isMultiple: false,
                pieces: [{ description: "clothing item", placement: "upper_body" }]
            };
        }

        res.json(parsedData);
    } catch (error: any) {
        console.error("Analysis Error:", error);
        res.status(500).json({ error: "Failed to analyze clothing." });
    }
});

// Secure endpoint for image generation
app.post("/api/generate", async (req, res) => {
    // If Admin SDK failed to initialize due to missing credentials, we simulate success
    // for trial purposes but we can't deduct credits securely.
    // In a real production app, you MUST have FIREBASE_SERVICE_ACCOUNT set in Vercel.
    const isDbConnected = db !== null;

    try {
        const validatedBody = generateSchema.safeParse(req.body);

        if (!validatedBody.success) {
            return res.status(400).json({
                error: "Invalid request data",
                details: validatedBody.error.flatten()
            });
        }

        const { uid, items, config } = validatedBody.data;

        // --- Determine sequential passes ---
        const passes: { category: string, garm_img: string, description: string }[] = [];
        const upperItem = items.find(i => i.placement === 'upper_body' && i.base64);
        const lowerItem = items.find(i => i.placement === 'lower_body' && i.base64);
        const dressItem = items.find(i => i.placement === 'dresses' && i.base64);

        if (dressItem) {
            const accs = items.filter(i => i.placement !== 'dresses').map(i => i.description);
            passes.push({
                category: 'dresses',
                garm_img: dressItem.base64!,
                description: `High-quality dresses item. ${accs.length ? 'Model wearing: ' + accs.join(', ') : ''}`
            });
        } else {
            const upperAccs = items.filter(i => ['eyewear', 'headwear', 'jewelry'].includes(i.placement)).map(i => i.description);
            const lowerAccs = items.filter(i => ['shoes', 'bags'].includes(i.placement)).map(i => i.description);

            if (upperItem) {
                passes.push({
                    category: 'upper_body',
                    garm_img: upperItem.base64!,
                    description: `High-quality upper_body item. ${upperAccs.length ? 'Model wearing: ' + upperAccs.join(', ') : ''}`
                });
            }
            if (lowerItem) {
                passes.push({
                    category: 'lower_body',
                    garm_img: lowerItem.base64!,
                    description: `High-quality lower_body item. ${lowerAccs.length ? 'Model wearing: ' + lowerAccs.join(', ') : ''}`
                });
            }
        }

        if (passes.length === 0) {
            return res.status(400).json({ error: "No primary clothing items (upper, lower, or dress) found to generate." });
        }

        const requiredCredits = passes.length;

        let remainingCredits = 0;
        if (isDbConnected && db) {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                return res.status(404).json({ error: "User not found" });
            }

            const userData = userDoc.data();
            if (!userData || userData.credits < requiredCredits) {
                return res.status(403).json({ error: `رصيدك غير كافٍ. لإتمام هذا الطقم تحتاج إلى ${requiredCredits} نقاط.` });
            }

            remainingCredits = userData.credits - requiredCredits;
        }

        // --- REPLICATE IMAGE GENERATION ---
        const replicateToken = process.env.REPLICATE_API_TOKEN || "";

        if (!replicateToken) {
            console.error("DEBUG - REPLICATE_API_TOKEN is missing in process.env");
            return res.status(500).json({ error: "Replicate token is missing. Please add REPLICATE_API_TOKEN in Vercel settings." });
        }

        console.log(`DEBUG - Calling Replicate API sequentially for ${passes.length} passes`);

        // Define default models based on gender and category if the user didn't upload one
        let currentHumanImageUri = config.modelImage;
        if (currentHumanImageUri && !currentHumanImageUri.startsWith('data:') && !currentHumanImageUri.startsWith('http')) {
            currentHumanImageUri = `data:image/jpeg;base64,${currentHumanImageUri}`;
        }

        if (!currentHumanImageUri) {
            if (config.gender === 'أطفال') {
                // High-quality full-body mannequin/model for kids
                currentHumanImageUri = "https://replicate.delivery/pbxt/L174bQ8O9o80zI20kS12vEFTX0Xf33kO6W4Hh0Gq7k3c5VnO/kid_mannequin.jpg"; // Replace with verified kid model if needed, using general straight-on for now
            } else if (config.gender === 'ذكر') {
                // High-quality full-body male model suitable for IDM-VTON
                currentHumanImageUri = "https://replicate.delivery/pbxt/L0TfUKYvE467HlQxNXYv8sS7nONwIu9YqG8r2Hn8C0H3X7xS/male_model.jpg";
            } else {
                // High-quality full-body female model suitable for IDM-VTON
                currentHumanImageUri = "https://replicate.delivery/pbxt/L0TfUKYvE467HlQxNXYv8sS7nONwIu9YqG8r2Hn8C0H3X7xS/female_model.jpg";
            }
        }

        let finalImageUrl = "";

        for (let i = 0; i < passes.length; i++) {
            const pass = passes[i];
            const garmImageUri = pass.garm_img.startsWith('data:')
                ? pass.garm_img
                : `data:image/jpeg;base64,${pass.garm_img}`;

            console.log(`DEBUG - Executing Pass ${i + 1}/${passes.length} (${pass.category})`);

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
                        version: "c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4", // IDM-VTON
                        input: {
                            crop: false,
                            seed: Math.floor(Math.random() * 2147483647),
                            steps: 30,
                            category: pass.category,
                            force_dc: false,
                            garm_img: garmImageUri,
                            human_img: currentHumanImageUri,
                            mask_only: false,
                            garment_des: `${pass.description}. Designed for ${config.gender === 'ذكر' ? 'Male' : config.gender === 'أطفال' ? 'Kid/Child' : 'Female'} ${config.category === 'kids' ? 'child' : config.category === 'youth' ? 'teenager' : 'adult'}. Style: ${config.pose || 'standing straight'}. Note: Camera angle is full body shot, do not crop face.`,
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

            // Replicate returns the image URL in `output` (can be a string or array)
            if (!replicateData.output) {
                console.error("DEBUG - Replicate Output Empty or Failed. Final Status:", replicateData.status, "Error:", replicateData.error);
                throw new Error(replicateData.error || "المحتوى غير لائق أو النظام لم يتمكن من التوليد.");
            }

            finalImageUrl = Array.isArray(replicateData.output) ? replicateData.output[0] : replicateData.output;
            currentHumanImageUri = finalImageUrl; // Feed the output into the next pass
        }

        // Fetch the GENERATED final image url and convert it to Base64 to retain the format the frontend expects
        const imageResponse = await fetch(finalImageUrl);
        const buffer = await imageResponse.arrayBuffer();
        const generatedImageBase64 = `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;

        // --- ONLY IF ALL PASSES SUCCESSFUL: Deduct credits ---
        if (isDbConnected && db) {
            const userRef = db.collection('users').doc(uid);
            await userRef.update({
                credits: admin.firestore.FieldValue.increment(-requiredCredits),
                totalGenerations: admin.firestore.FieldValue.increment(requiredCredits)
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
