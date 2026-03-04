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
  // Mock function, no real API call to Gemini
  // We return a promise that resolves with the mock clothing image
  // after a short delay to simulate network request.
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

  console.log("Mocking fashion generation with config:", {
    gender: config.gender,
    category: config.category,
    pose: finalPose,
    background: finalBackground,
    cameraAngle: config.cameraAngle,
    isFreeTrial: config.isFreeTrial
  });

  return new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve(clothingImageBase64); // Return the original clothing image as a mock result
    }, 2000);
  });
};
