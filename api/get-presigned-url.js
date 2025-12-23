import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  const { fileName, contentType } = req.query;
  const key = `products/${Date.now()}_${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  try {
    const url = await getSignedUrl(s3, command, { expiresIn: 60 });
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    res.status(200).json({ url, publicUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
