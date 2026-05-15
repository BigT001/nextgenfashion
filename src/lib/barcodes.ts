import bwipjs from "bwip-js";

/**
 * Generate a high-fidelity barcode as a Data URL
 */
export async function generateBarcode(text: string): Promise<string> {
  try {
    const canvas = document.createElement("canvas");
    bwipjs.toCanvas(canvas, {
      bcid: "code128",       // Barcode type
      text: text,            // Text to encode
      scale: 3,              // 3x scaling factor
      height: 10,            // Bar height, in millimeters
      includetext: true,     // Show human-readable text
      textxalign: "center",  // Always good to set
      backgroundcolor: "ffffff"
    });
    return canvas.toDataURL("image/png");
  } catch (e) {
    console.error("Barcode generation failed:", e);
    return "";
  }
}

/**
 * Generate barcode on the server (returning base64)
 */
export async function generateBarcodeServer(text: string): Promise<string> {
    return new Promise((resolve, reject) => {
        bwipjs.toBuffer({
            bcid: 'code128',
            text: text,
            scale: 3,
            height: 10,
            includetext: true,
            textxalign: 'center',
            backgroundcolor: 'ffffff'
        }, (err, png) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                resolve(`data:image/png;base64,${png.toString('base64')}`);
            }
        });
    });
}
