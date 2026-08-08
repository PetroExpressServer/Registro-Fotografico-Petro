export function applyWatermark(file, slotTitle, supervisorName) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1400;
        let w = img.width;
        let h = img.height;

        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        // Draw original photo 100% clean - NO blue boxes, text or overlays
        ctx.drawImage(img, 0, 0, w, h);

        // Compress JPEG high quality
        const resultBase64 = canvas.toDataURL('image/jpeg', 0.85);
        resolve(resultBase64);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
