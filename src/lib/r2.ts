import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'

if (!process.env.R2_ACCOUNT_ID) throw new Error('Missing R2_ACCOUNT_ID')
if (!process.env.R2_ACCESS_KEY_ID) throw new Error('Missing R2_ACCESS_KEY_ID')
if (!process.env.R2_SECRET_ACCESS_KEY) throw new Error('Missing R2_SECRET_ACCESS_KEY')
if (!process.env.R2_BUCKET_NAME) throw new Error('Missing R2_BUCKET_NAME')

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const BUCKET = process.env.R2_BUCKET_NAME

/** Upload a file to R2. Returns the storage key. */
export async function uploadToR2(key: string, body: Buffer, contentType: string): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
  return key
}

/** Delete a file from R2 by key. */
export async function deleteFromR2(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
  )
}

/** Get a file stream from R2 by key. Returns the body stream and content type. */
export async function getFromR2(key: string): Promise<{ body: ReadableStream; contentType: string }> {
  const result = await s3.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
  )

  if (!result.Body) {
    throw new Error('Empty response from R2')
  }

  return {
    body: result.Body.transformToWebStream(),
    contentType: result.ContentType ?? 'application/octet-stream',
  }
}
