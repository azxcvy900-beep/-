export const addWatermarkToImage = async (base64Image: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Image;
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(base64Image); // Fallback to original
                return;
            }

            // Draw original image
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Configure watermark styling
            ctx.globalAlpha = 0.7; // 70% opacity
            ctx.fillStyle = "white";
            ctx.textBaseline = "bottom";
            ctx.textAlign = "right";

            // Calculate 15% ratio roughly for text size based on image width
            // In professional apps, we might literally draw a logo image, but we'll use a text logo here
            const fontSize = Math.floor(canvas.width * 0.05); // 5% of width makes it large enough without dominating
            ctx.font = `bold ${fontSize}px serif`;

            // Draw shadow for visibility
            ctx.shadowColor = "rgba(0,0,0,0.8)";
            ctx.shadowBlur = Math.max(2, fontSize / 5);

            const text = "YAFA DESIGN";
            const padding = Math.floor(canvas.width * 0.03);

            ctx.fillText(text, canvas.width - padding, canvas.height - padding);

            resolve(canvas.toDataURL('image/png', 1.0));
        };
        img.onerror = () => reject(new Error("Failed to load image for watermarking"));
    });
};
