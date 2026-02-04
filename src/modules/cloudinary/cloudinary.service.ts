import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryUploadResult } from './cloudinary.types';

@Injectable()
export class CloudinaryService {
  // NestJS Logger — automatically uses Pino under the hood (from nestjs-pino)
  // CloudinaryService.name gives "CloudinaryService" as the logger context
  private readonly logger = new Logger(CloudinaryService.name);

  // Upload a file buffer to Cloudinary with auto-optimization
  async uploadImage(buffer: Buffer, folder: string): Promise<CloudinaryUploadResult> {
    return this.withRetry(async () => {
      const startTime = Date.now();

      // upload_stream accepts a buffer — no temp files written to disk
      // We wrap it in a Promise because the SDK uses a callback pattern
      const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder, // organizes assets: "products/abc123", "categories/def456"
              quality: 'auto:best', // Cloudinary picks optimal quality per image
              fetch_format: 'auto', // serves WebP/AVIF based on browser Accept header
              resource_type: 'image', // explicitly restrict to images only
            },
            (error, result) => {
              if (error) {
                return reject(new Error(error.message || 'Cloudinary upload failed'));
              }
              if (!result) {
                return reject(new Error('Cloudinary returned no result'));
              }
              resolve({
                url: result.secure_url, // HTTPS URL from Cloudinary CDN
                publicId: result.public_id, // unique ID for deletion/transformation
              });
            },
          )
          .end(buffer); // pipe the buffer into the upload stream
      });

      const duration = Date.now() - startTime;
      this.logger.log(
        `Uploaded image to ${folder} (${(buffer.length / 1024).toFixed(1)}KB, ${duration}ms) → ${result.publicId}`,
      );

      return result;
    });
  }

  // Delete a single image from Cloudinary by its public ID
  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
    this.logger.log(`Deleted image: ${publicId}`);
  }

  // Delete multiple images in parallel — used when hard-deleting a product
  // Promise.allSettled ensures one failure doesn't block others
  async deleteImages(publicIds: string[]): Promise<void> {
    if (publicIds.length === 0) {
      return;
    }

    const results = await Promise.allSettled(
      publicIds.map((id) => cloudinary.uploader.destroy(id)),
    );

    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      this.logger.warn(`Failed to delete ${failed.length}/${publicIds.length} Cloudinary images`);
    } else {
      this.logger.log(`Deleted ${publicIds.length} Cloudinary images`);
    }
  }

  // Retry wrapper for transient failures (network blips, Cloudinary 5xx)
  // 4xx errors (bad request, auth) fail immediately — no point retrying
  private async withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: unknown) {
        // Cloudinary errors have http_code property
        const httpCode =
          error instanceof Object && 'http_code' in error
            ? (error as { http_code: number }).http_code
            : undefined;

        // 4xx = client error (bad input, auth) — don't retry
        const isRetryable = !httpCode || httpCode >= 500;

        if (attempt === maxRetries || !isRetryable) {
          throw error;
        }

        // Exponential backoff: 2s, 4s, 8s + random jitter (0-500ms)
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        this.logger.warn(
          `Upload attempt ${attempt}/${maxRetries} failed, retrying in ${Math.round(delay)}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // TypeScript requires this — the loop always returns or throws
    throw new Error('Retry loop exhausted');
  }
}
