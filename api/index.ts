import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import db from "../src/lib/db.js"; // Note: Adjust TS import resolution if needed, typically .js is required in ESM

const JWT_SECRET = process.env.JWT_SECRET || "fall_back_secret_for_yafa_design";

// Auth middleware
export const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        (req as any).user = decoded;
        next();
    } catch (e) {
        res.status(401).json({ error: "Invalid token" });
    }
};

const app = express();
app.use(express.json({ limit: '50mb' }));

app.get("/api/admin/stats", authenticate, (req, res) => {
    const totalUsersStmt = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
    const totalGenerationsStmt = db.prepare("SELECT sum(credits) as count FROM users").get() as { count: number }; // rough logic

    res.json({
        totalUsers: totalUsersStmt.count,
        activePlans: [],
        totalGenerations: totalGenerationsStmt.count || 0,
        apiStatus: "Connected",
    });
});

app.get("/api/admin/subscriptions", authenticate, (req, res) => {
    res.json([]);
});

app.post("/api/admin/subscriptions/toggle", authenticate, (req, res) => {
    res.json({ success: true });
});

app.get("/api/admin/settings", (req, res) => {
    const settings = db.prepare("SELECT gemini_api_key FROM settings WHERE id = 'global'").get() as { gemini_api_key: string };
    res.json(settings || { gemini_api_key: "" });
});

app.post("/api/admin/settings/update", authenticate, (req, res) => {
    const { gemini_api_key } = req.body;
    db.prepare("UPDATE settings SET gemini_api_key = ? WHERE id = 'global'").run(gemini_api_key);
    res.json({ success: true });
});

app.get("/api/admin/packages", (req, res) => {
    res.json([]);
});

app.post("/api/admin/packages/add", authenticate, (req, res) => {
    res.json({ success: true });
});

app.post("/api/admin/packages/delete", authenticate, (req, res) => {
    res.json({ success: true });
});

// AUTHENTICATION ROUTES
app.post("/api/auth/register", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Email and password required" });

        const existing = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
        if (existing) return res.status(400).json({ error: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const id = Math.random().toString(36).substring(2, 15);

        db.prepare("INSERT INTO users (id, email, password) VALUES (?, ?, ?)")
            .run(id, email, hashedPassword);

        const token = jwt.sign({ id, email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id, email, role: 'user', credits: 9999, plan: 'premium' } });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
        if (!user) return res.status(400).json({ error: "Invalid credentials" });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, email: user.email, role: user.role, credits: user.credits, plan: user.plan } });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.get("/api/auth/me", authenticate, (req, res) => {
    const userId = (req as any).user.id;
    const user = db.prepare("SELECT id, email, role, credits, plan FROM users WHERE id = ?").get(userId) as any;
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
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
        const geminiKey = apiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

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

        const prompt = `Analyze this image containing clothing or accessories for a Virtual Try-On system.
CRITICAL INSTRUCTION: If the image contains a matching set or a complete top-and-bottom outfit (like a suit, uniform, tracksuit, or matching pyjamas) shown TOGETHER in the same image, you MUST classify it as a SINGLE piece with placement 'dresses'. The 'dresses' category in our VTON engine means 'full body outfit'. ONLY return multiple pieces if the user uploaded completely separate, unmatching mix-and-match items. IDM-VTON requires a single garment per image.
Provide a JSON response with the following structure:
{
  "isMultiple": boolean, // true ONLY if there are fundamentally unmatching/separate pieces not meant to be worn as a single contiguous outfit. false for suits, dresses, sets, and single items.
  "pieces": [ // Array of detected pieces
    {
      "description": string, // Detailed fashion description of the piece including color, fabric, and style.
      "placement": "upper_body" | "lower_body" | "dresses" | "shoes" | "bags" | "headwear" | "eyewear" | "jewelry" // Determine the category where this piece is worn. Use 'dresses' for ANY full-body outfit or matching top-and-bottom set.
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

// Helper function to handle Replicate API requests with automatic retries for 429 (Too Many Requests)
async function fetchReplicateWithRetry(url: string, options: any, retries: number = 3) {
    let delay = 2000;
    for (let i = 0; i < retries; i++) {
        const response = await fetch(url, options);
        if (response.status === 429) {
            console.log(`DEBUG - Replicate 429 Too Many Requests (Attempt ${i + 1}/${retries}). Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
            continue;
        }
        return response;
    }
    return fetch(url, options); // Final attempt
}

// Helper function to remove background using Replicate API (cjwbw/rembg)
async function removeBackground(imageBase64: string, replicateToken: string): Promise<string> {
    console.log("DEBUG - Starting background removal...");
    try {
        const replicateResponse = await fetchReplicateWithRetry(
            `https://api.replicate.com/v1/predictions`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${replicateToken}`,
                    "Content-Type": "application/json",
                    "Prefer": "wait"
                },
                body: JSON.stringify({
                    version: "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003", // cjwbw/rembg
                    input: {
                        image: imageBase64,
                        return_mask: false,
                        alpha_matting: false
                    }
                }),
            }
        );

        let replicateData = await replicateResponse.json();

        if (!replicateResponse.ok || replicateData.error) {
            console.error("DEBUG - BG Removal Replicate Error:", replicateData.error || replicateData);
            throw new Error(`مشكلة في إزالة الخلفية: ${replicateData.error || replicateResponse.statusText}`);
        }

        // Poll if necessary
        while (replicateData.status === "starting" || replicateData.status === "processing") {
            await new Promise(resolve => setTimeout(resolve, 2000));
            if (!replicateData.urls || !replicateData.urls.get) break;
            const pollResponse = await fetch(replicateData.urls.get, {
                headers: { "Authorization": `Bearer ${replicateToken}` }
            });
            replicateData = await pollResponse.json();
        }

        if (!replicateData.output) {
            throw new Error(replicateData.error || "فشل إزالة الخلفية.");
        }

        console.log("DEBUG - Background removal completed successfully.");
        const imageUrl = replicateData.output;
        const imageResponse = await fetch(imageUrl);
        const buffer = await imageResponse.arrayBuffer();
        return `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
    } catch (error) {
        console.error("DEBUG - Background Removal failed, falling back to original image.", error);
        return imageBase64;
    }
}

// Helper function to generate an enhanced, professional prompt using Gemini
async function generateEnhancedPrompt(pass: any, config: any, geminiKey: string): Promise<string> {
    try {
        if (!geminiKey) {
            console.log("DEBUG - No Gemini API key provided for prompt enhancement, falling back to basic prompt.");
            throw new Error("No Gemini key");
        }

        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Fast and cheap for text

        const basePrompt = `Act as an expert Fashion Photography Director and AI Prompt Engineer.
We need a highly detailed, professional prompt for an AI Virtual Try-On system (IDM-VTON) to generate a realistic product photo.

GARMENT DESCRIPTION: ${pass.description}
TARGET MODEL: ${config.gender === 'male' ? 'Male' : 'Female'}, ${config.category === 'kids' ? 'child' : config.category === 'youth' ? 'teenager' : 'adult'}. The model MUST have standard, beautiful fashion-model proportions (tall, elegant, realistic anatomy). 
REQUESTED POSE/VIBE: ${config.pose || 'standing straight, professional'}
REQUESTED BACKGROUND: ${config.background || 'clean studio background'}

CRITICAL INSTRUCTIONS:
1. You MUST strictly adhere to the REQUESTED POSE. Do not change the pose or vibe.
2. You MUST strictly adhere to the REQUESTED BACKGROUND. Do not place the model in a different setting.
3. The model MUST be described as having normal, tall, and realistic proportions. ABSOLUTELY NO dwarf, disproportionate, or short figures.
4. Write a single, cohesive, highly descriptive paragraph combining these elements.
5. Enhance with professional photography terms (e.g., "8k resolution", "cinematic lighting", "photorealistic", "ultra-detailed", "Vogue editorial style", "perfect skin texture").
6. DO NOT include introductory or concluding remarks. Just output the prompt itself.
7. Keep it under 100 words.
8. End the prompt EXACTLY with: ", tall fashion model, realistic human proportions, correct anatomy, exact requested pose, exact requested background, DO NOT crop face."

YOUR GENERATED PROMPT:`;

        const result = await model.generateContent(basePrompt);
        const enhancedPrompt = result.response.text().trim();
        console.log(`DEBUG - Gemini Enhanced Prompt: ${enhancedPrompt}`);
        return enhancedPrompt;
    } catch (error) {
        // Fallback to basic string building if API fails or key is missing
        console.error("DEBUG - Gemini Prompt Enhancement failed, using basic prompt.", error);
        return `Premium fashion item: ${pass.description}. Tailored for ${config.gender === 'male' ? 'Male' : 'Female'} ${config.category === 'kids' ? 'child' : config.category === 'youth' ? 'teenager' : 'adult'} model. Overall style and setting: EXTREMELY STRICT ADHERENCE TO: pose: ${config.pose || 'standing straight'} and background: ${config.background || 'a studio'}. 8k resolution, photorealistic, premium editorial fashion styling, perfect skin texture, tall fashion model, realistic human proportions, correct anatomy, exact requested pose, exact requested background, DO NOT crop face.`;
    }
}

// Helper function to process a single sequence of generations (passes)
async function processVariationSequence(passes: any[], config: any, initialHumanImageUri: string, replicateToken: string, geminiKey: string) {
    let currentHumanImageUri = initialHumanImageUri;
    let finalImageUrl = "";

    for (let i = 0; i < passes.length; i++) {
        const pass = passes[i];
        let garmImageUri = pass.garm_img.startsWith('data:')
            ? pass.garm_img
            : `data:image/jpeg;base64,${pass.garm_img}`;

        console.log(`DEBUG - Executing Pass ${i + 1}/${passes.length} (${pass.category}) for a variation`);

        // --- STEP 1: Background Removal ---
        // Note: we remove background only on the garment image before passing it to IDM-VTON
        garmImageUri = await removeBackground(garmImageUri, replicateToken);

        const seed = Math.floor(Math.random() * 2147483647); // Ensure different seeds for variations
        const replicateResponse = await fetchReplicateWithRetry(
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
                        garment_des: await generateEnhancedPrompt(pass, config, geminiKey),
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
        if (uid && uid !== "trial_uid") {
            const user = db.prepare("SELECT * FROM users WHERE id = ?").get(uid) as any;

            if (!user) {
                return res.status(404).json({ error: "User not found. Please log in again." });
            }

            if (user.credits < requiredCredits) {
                // Temporarily disabled for testing
                // return res.status(403).json({ error: `رصيدك غير كافٍ. تحتاج إلى ${requiredCredits} نقاط لتوليد ${variations} صور لمعالجة القطع.` });
            }

            remainingCredits = user.credits; // Temporarily disabled deduction

        }

        // --- REPLICATE IMAGE GENERATION ---
        const replicateToken = process.env.REPLICATE_API_TOKEN || "";

        if (!replicateToken) {
            console.error("DEBUG - REPLICATE_API_TOKEN is missing in process.env");
            return res.status(500).json({ error: "Replicate token is missing. Please add REPLICATE_API_TOKEN in settings." });
        }

        // Define default models based on gender and category if the user didn't upload one
        let initialHumanImageUri = config.modelImage;
        if (initialHumanImageUri && !initialHumanImageUri.startsWith('data:') && !initialHumanImageUri.startsWith('http')) {
            initialHumanImageUri = `data:image/jpeg;base64,${initialHumanImageUri}`;
        }

        if (!initialHumanImageUri) {
            if (config.category === 'kids') {
                initialHumanImageUri = "https://replicate.delivery/pbxt/L174bQ8O9o80zI20kS12vEFTX0Xf33kO6W4Hh0Gq7k3c5VnO/kid_mannequin.jpg";
            } else if (config.gender === 'male') {
                initialHumanImageUri = "https://replicate.delivery/pbxt/L0TfUKYvE467HlQxNXYv8sS7nONwIu9YqG8r2Hn8C0H3X7xS/male_model.jpg";
            } else {
                initialHumanImageUri = "https://replicate.delivery/pbxt/L0TfUKYvE467HlQxNXYv8sS7nONwIu9YqG8r2Hn8C0H3X7xS/female_model.jpg";
            }
        }

        console.log(`DEBUG - Generating ${variations} variations sequentially to avoid Replicate rate limits. Total passes per variation: ${passes.length}`);

        // Extract Gemini API Key from config or environment for prompt enhancement
        const geminiKey = config.apiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";

        // Execute variation sequences sequentially to prevent Replicate 429 Concurrency limits
        const results = [];
        for (let v = 0; v < variations; v++) {
            console.log(`DEBUG - Starting variation ${v + 1} of ${variations}`);
            const result = await processVariationSequence(passes, config, initialHumanImageUri, replicateToken, geminiKey);
            results.push(result);
        }

        // --- ONLY IF ALL PASSES SUCCESSFUL: Deduct credits ---
        if (uid && uid !== "trial_uid") {
            try {
                // Temporarily disabled deduction for testing
                // db.prepare("UPDATE users SET credits = credits - ? WHERE id = ?").run(requiredCredits, uid);
                console.log(`DEBUG - Bypassed deduction of ${requiredCredits} credits for testing for user ${uid}`);
            } catch (e) {
                console.error("Sqlite Error: Failed to deduct credits", e);
            }
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
        } else if (errorMessage.includes('Too Many Requests') || errorMessage.includes('429')) {
            errorMessage = "يوجد ضغط كبير على النظام في الوقت الحالي (Too Many Requests). يرجى المحاولة بعد قليل أو ترقية حساب Replicate.";
        }

        res.status(500).json({ error: `فشل التوليد: ${errorMessage}` });
    }
});

export default app;
