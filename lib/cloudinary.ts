import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (
  file: File,
  folder: string = "gamepass",
) => {
  try {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const dataURI = `data:${file.type};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder,
      resource_type: "auto",
    });

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return {
      success: false,
      error: "Failed to upload image",
    };
  }
};

export const deleteFromCloudinary = async (publicId: string) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return { success: false, error: "Failed to delete image" };
  }
};

export default cloudinary;

// import crypto from "crypto";

// export const uploadToCloudinary = async (
//   file: File,
//   folder: string = "gamepass",
// ) => {
//   try {
//     const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
//     const apiKey = process.env.CLOUDINARY_API_KEY!;
//     const apiSecret = process.env.CLOUDINARY_API_SECRET!;

//     const timestamp = Math.floor(Date.now() / 1000);

//     // 🔐 Generate signature
//     const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
//     const signature = crypto
//       .createHash("sha1")
//       .update(signatureString)
//       .digest("hex");

//     // 📦 Convert file ke base64
//     const buffer = await file.arrayBuffer();
//     const base64 = Buffer.from(buffer).toString("base64");
//     const dataURI = `data:${file.type};base64,${base64}`;

//     // 🚀 Request ke Cloudinary API
//     const res = await fetch(
//       `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
//       {
//         method: "POST",
//         body: new URLSearchParams({
//           file: dataURI,
//           api_key: apiKey,
//           timestamp: timestamp.toString(),
//           signature,
//           folder,
//         }),
//       },
//     );

//     const data = await res.json();

//     if (!res.ok) {
//       throw new Error(JSON.stringify(data));
//     }

//     return {
//       success: true,
//       url: data.secure_url,
//       public_id: data.public_id,
//     };
//   } catch (error) {
//     console.error("❌ Cloudinary API upload error:", error);

//     return {
//       success: false,
//       error: "Failed to upload image",
//     };
//   }
// };

// export const deleteFromCloudinary = async (publicId: string) => {
//   try {
//     const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
//     const apiKey = process.env.CLOUDINARY_API_KEY!;
//     const apiSecret = process.env.CLOUDINARY_API_SECRET!;

//     const timestamp = Math.floor(Date.now() / 1000);

//     const signatureString = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
//     const signature = crypto
//       .createHash("sha1")
//       .update(signatureString)
//       .digest("hex");

//     const res = await fetch(
//       `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
//       {
//         method: "POST",
//         body: new URLSearchParams({
//           public_id: publicId,
//           api_key: apiKey,
//           timestamp: timestamp.toString(),
//           signature,
//         }),
//       },
//     );

//     const data = await res.json();

//     if (!res.ok) {
//       throw new Error(JSON.stringify(data));
//     }

//     return { success: true };
//   } catch (error) {
//     console.error("❌ Cloudinary API delete error:", error);

//     return {
//       success: false,
//       error: "Failed to delete image",
//     };
//   }
// };
