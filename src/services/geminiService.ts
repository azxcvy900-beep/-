export const generateFashionImage = async (
  clothingImageBase64: string,
  config: {
    apiKey?: string;
    gender: string;
    category: string;
    pose: string;
    background: string;
    cameraAngle?: string;
    modelImage?: string;
    isFreeTrial?: boolean;
  }
) => {
  let finalPose = config.pose;
  let finalBackground = config.background;

  // Supercharge the prompt if the user is on a free trial to guarantee an amazing result
  if (config.isFreeTrial) {
    finalPose += ", Captured by a professional fashion product photographer, perfectly fitted on a premium mannequin or invisible dummy, 8k resolution, ultra-detailed, cinematic studio lighting, photorealistic.";
    finalBackground += ", soft elegant shadows, high-end e-commerce product background, seamless backdrop.";
  } else {
    // Standard baseline for all generations to ensure clean product display
    finalPose += ", clean professional clothing display, mannequin or invisible dummy technique, high-quality fashion rendering.";
  }

  const prompt = `A professional fashion e-commerce photo of a ${config.category} for a ${config.gender}. The model should be styled using ${finalPose}. Background: ${finalBackground}. Camera angle: ${config.cameraAngle || 'front'}. Maximize realism and luxury fashion aesthetics.`;

  console.log("Generating with Nano Banana Pro (Gemini 3 Pro Image) config:", { prompt });

  try {
    // @ts-ignore
    const apiKey = config.apiKey || import.meta.env.VITE_GEMINI_API_KEY; if (!apiKey) throw new Error("Gemini API key is missing. Please check your .env file or settings.");

    // Extract raw base64 data
    const base64Data = clothingImageBase64.includes(',') ? clothingImageBase64.split(',')[1] : clothingImageBase64;
    // Guess MIME type or default
    const mimeMatch = clothingImageBase64.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
      }
    };

    // Make the explicit API call to the preview image model
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API Error Response:", errText);
      throw new Error(`Gemini API failed with status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts;

    if (parts && parts.length > 0) {
      // Look for an image part returned by the model
      const imagePart = parts.find((p: any) => p.inlineData);
      if (imagePart && imagePart.inlineData.data) {
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
      }

      // If the model returned a URL or text content (some image endpoints return URLs or markdown)
      const textPart = parts.find((p: any) => p.text);
      if (textPart) {
        // Simple extraction for markdown image URLs if it returns one
        const urlMatch = textPart.text.match(/!\[.*?\]\((https?:\/\/.*?)\)/);
        if (urlMatch && urlMatch[1]) {
          return urlMatch[1];
        }
        console.warn("Model returned text instead of a clear image block:", textPart.text);
      }
    }

    // Fallback if no valid image data was extracted
    console.warn("No explicit image data parsed from Nano Banana Pro response, returning original.");
    return clothingImageBase64;

  } catch (error) {
    console.error("Failed to generate fashion image via Gemini:", error);
    // Graceful degradation: return the original image if API fails
    return clothingImageBase64;
  }
};
