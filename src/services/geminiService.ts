import { GoogleGenAI } from "@google/genai";

export const generateFashionImage = async (
  clothingImageBase64: string,
  config: {
    gender: string;
    category: string;
    pose: string;
    background: string;
    cameraAngle?: string;
    modelImage?: string;
  }
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const prompt = `
    Create a professional fashion photograph. 
    The model should be wearing the clothing items provided in the image.
    Model Details:
    - Gender: ${config.gender}
    - Age Category: ${config.category}
    - Pose: ${config.pose}
    
    Photography:
    - Camera Angle: ${config.cameraAngle || 'Full body shot'}
    
    Environment:
    - Background: ${config.background}
    
    Style: Professional commercial photography, high-end fashion magazine look, sharp focus, studio lighting.
    Ensure the clothing from the provided image is accurately represented on the model.
  `;

  const parts = [
    {
      inlineData: {
        data: clothingImageBase64.split(',')[1],
        mimeType: "image/png",
      },
    },
    { text: prompt },
  ];

  if (config.modelImage) {
    parts.push({
      inlineData: {
        data: config.modelImage.split(',')[1],
        mimeType: "image/png",
      },
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("No image generated");
};
