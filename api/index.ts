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
    variations: z.number().min(1).max(4).default(1),
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

// Helper function to process a single sequence of generations (passes)
async function processVariationSequence(passes: any[], config: any, initialHumanImageUri: string, replicateToken: string) {
    let currentHumanImageUri = initialHumanImageUri;
    let finalImageUrl = "";

    for (let i = 0; i < passes.length; i++) {
        const pass = passes[i];
        const garmImageUri = pass.garm_img.startsWith('data:')
            ? pass.garm_img
            : `data:image/jpeg;base64,${pass.garm_img}`;

        console.log(`DEBUG - Executing Pass ${i + 1}/${passes.length} (${pass.category}) for a variation`);

        const seed = Math.floor(Math.random() * 2147483647); // Ensure different seeds for variations
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
                        seed: seed,
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

        if (!replicateResponse.ok || replicateData.error) {
            console.error("DEBUG - Replicate Error:", replicateData.error || replicateData);
            if (replicateResponse.status === 401) {
                throw new Error("UNAUTHORIZED"); // Handled in catch
            }
            throw new Error(`مشكلة في محرك Replicate: ${replicateData.error || replicateResponse.statusText}.`);
        }

        // Poll if necessary
        while (replicateData.status === "starting" || replicateData.status === "processing") {
            await new Promise(resolve => setTimeout(resolve, 2500));
            if (!replicateData.urls || !replicateData.urls.get) break;
            const pollResponse = await fetch(replicateData.urls.get, {
                headers: { "Authorization": `Bearer ${replicateToken}` }
            });
            replicateData = await pollResponse.json();
        }

        if (!replicateData.output) {
            throw new Error(replicateData.error || "المحتوى غير لائق أو النظام لم يتمكن من التوليد.");
        }

        finalImageUrl = Array.isArray(replicateData.output) ? replicateData.output[0] : replicateData.output;
        currentHumanImageUri = finalImageUrl; // Feed output into next pass
    }

    // Convert final image to Base64
    const imageResponse = await fetch(finalImageUrl);
    const buffer = await imageResponse.arrayBuffer();
    return `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
}

// Secure endpoint for image generation
app.post("/api/generate", async (req, res) => {
    // If Admin SDK failed to initialize due to missing credentials, we simulate success
    // for trial purposes but we can't deduct credits securely.
    // In a real production app, you MUST have FIREBASE_SERVICE_ACCOUNT set in Vercel.
    const isDbConnected = db !== null;

    try {
        // We supply 1 as a default if variations isn't passed in the req body
        if (!req.body.variations) req.body.variations = 1;

        const validatedBody = generateSchema.safeParse(req.body);

        if (!validatedBody.success) {
            return res.status(400).json({
                error: "Invalid request data",
                details: validatedBody.error.flatten()
            });
        }

        const { uid, items, config, variations } = validatedBody.data;

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

        // Calculate credits based on number of passes AND number of variations requested
        const requiredCredits = passes.length * variations;

        let remainingCredits = 0;
        if (isDbConnected && db) {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                return res.status(404).json({ error: "User not found" });
            }

            const userData = userDoc.data();
            if (!userData || userData.credits < requiredCredits) {
                return res.status(403).json({ error: `رصيدك غير كافٍ. تحتاج إلى ${requiredCredits} نقاط لتوليد ${variations} صور لمعالجة القطع.` });
            }

            remainingCredits = userData.credits - requiredCredits;
        }

        // --- REPLICATE IMAGE GENERATION ---
        const replicateToken = process.env.REPLICATE_API_TOKEN || "";

        if (!replicateToken) {
            console.error("DEBUG - REPLICATE_API_TOKEN is missing in process.env");
            return res.status(500).json({ error: "Replicate token is missing. Please add REPLICATE_API_TOKEN in Vercel settings." });
        }

        // Define default models based on gender and category if the user didn't upload one
        let initialHumanImageUri = config.modelImage;
        if (initialHumanImageUri && !initialHumanImageUri.startsWith('data:') && !initialHumanImageUri.startsWith('http')) {
            initialHumanImageUri = `data:image/jpeg;base64,${initialHumanImageUri}`;
        }

        if (!initialHumanImageUri) {
            if (config.gender === 'أطفال') {
                initialHumanImageUri = "https://replicate.delivery/pbxt/L174bQ8O9o80zI20kS12vEFTX0Xf33kO6W4Hh0Gq7k3c5VnO/kid_mannequin.jpg";
            } else if (config.gender === 'ذكر') {
                initialHumanImageUri = "https://replicate.delivery/pbxt/L0TfUKYvE467HlQxNXYv8sS7nONwIu9YqG8r2Hn8C0H3X7xS/male_model.jpg";
            } else {
                initialHumanImageUri = "https://replicate.delivery/pbxt/L0TfUKYvE467HlQxNXYv8sS7nONwIu9YqG8r2Hn8C0H3X7xS/female_model.jpg";
            }
        }

        console.log(`DEBUG - Generating ${variations} variations in parallel. Total initial passes required per variation: ${passes.length}`);

        // Execute variation sequences in parallel
        const variationPromises = [];
        for (let v = 0; v < variations; v++) {
            variationPromises.push(processVariationSequence(passes, config, initialHumanImageUri, replicateToken));
        }

        const results = await Promise.all(variationPromises);

        // --- ONLY IF ALL PASSES SUCCESSFUL: Deduct credits ---
        if (isDbConnected && db) {
            const userRef = db.collection('users').doc(uid);
            await userRef.update({
                credits: admin.firestore.FieldValue.increment(-requiredCredits),
                totalGenerations: admin.firestore.FieldValue.increment(requiredCredits)
            });
        }

        console.log(`Success! Generated ${results.length} images via Replicate.`);
        res.json({ results, remainingCredits });

    } catch (error: any) {
        console.error("DEBUG - Generation error details:", {
            message: error.message,
            stack: error.stack,
            code: error.code,
            status: error.status
        });

        let errorMessage = error.message || 'خطأ غير معروف';

        if (errorMessage === "UNAUTHORIZED" || errorMessage.includes('401') || errorMessage.includes('Payment')) {
            errorMessage = "المفتاح غير مفعل. تحتاج لإضافة بطاقة بنكية في حساب Replicate ليعمل بصورة صحيحة.";
        } else if (errorMessage.includes('NSFW content')) {
            errorMessage = "عذراً، نظام الحماية التلقائي حجب التوليد. يرجى تجربة صورة أخرى لا تتضمن محتوى غير لائق.";
        }

        res.status(500).json({ error: `فشل التوليد: ${errorMessage}` });
    }
});

export default app;
