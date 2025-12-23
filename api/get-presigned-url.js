import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default async function handler(req, res) {
  try {
    // 1. Check for missing variables immediately
    const missing = [];
    if (!process.env.R2_ACCOUNT_ID) missing.push("R2_ACCOUNT_ID");
    if (!process.env.R2_ACCESS_KEY_ID) missing.push("R2_ACCESS_KEY_ID");
    if (!process.env.R2_SECRET_ACCESS_KEY) missing.push("R2_SECRET_ACCESS_KEY");
    if (!process.env.R2_BUCKET_NAME) missing.push("R2_BUCKET_NAME");

    if (missing.length > 0) {
      return res.status(500).json({ 
        error: `Deployment Error: Missing Variables: ${missing.join(", ")}`,
        help: "Add these in Vercel Project Settings > Environment Variables" 
      });
    }

    const { fileName, contentType } = req.query;
    if (!fileName) return res.status(400).json({ error: "fileName is required" });

    // 2. Initialize S3 Client
    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });

    const key = `products/${Date.now()}_${fileName.replace(/\s+/g, '_')}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType || 'application/octet-stream',
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 60 });
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    return res.status(200).json({ url, publicUrl });

  } catch (err) {
    // This sends the actual error message to your browser console
    console.error(err);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      message: err.message,
      stack: err.stack 
    });
  }
}
