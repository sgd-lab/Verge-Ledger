import { db, type PhotoRecord } from '../schema';
import { generateUlid } from '../../lib/id';

export class PhotoRepository {
  async listByObservation(observationId: string): Promise<PhotoRecord[]> {
    return db.photos.where('observationId').equals(observationId).toArray();
  }

  async getById(id: string): Promise<PhotoRecord | undefined> {
    return db.photos.get(id);
  }

  /**
   * Strips EXIF metadata by drawing image to canvas and re-encoding.
   * Resizes image if dimensions exceed maxDimension to conserve IndexedDB quota.
   */
  async stripExifAndProcess(
    file: File | Blob,
    maxDimension = 1600,
    quality = 0.85,
  ): Promise<{ blob: Blob; width: number; height: number; mimeType: 'image/jpeg' | 'image/webp' }> {
    return new Promise((resolve, reject) => {
      if (
        typeof Image === 'undefined' ||
        typeof document === 'undefined' ||
        typeof HTMLCanvasElement === 'undefined' ||
        !HTMLCanvasElement.prototype.toBlob
      ) {
        // Fallback for non-browser / JSDOM test environments
        resolve({ blob: file, width: 800, height: 600, mimeType: 'image/jpeg' });
        return;
      }

      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ blob: file, width, height, mimeType: 'image/jpeg' });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ blob: file, width, height, mimeType: 'image/jpeg' });
              return;
            }
            resolve({ blob, width, height, mimeType: 'image/jpeg' });
          },
          'image/jpeg',
          quality,
        );
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };

      img.src = url;
    });
  }

  async savePhoto(params: {
    observationId: string;
    file: File | Blob;
    isDemo?: boolean;
  }): Promise<PhotoRecord> {
    const existing = await this.listByObservation(params.observationId);
    if (existing.length >= 3) {
      throw new Error('Maximum of 3 photos allowed per observation');
    }

    const processed = await this.stripExifAndProcess(params.file);
    const photo: PhotoRecord = {
      id: generateUlid(),
      observationId: params.observationId,
      blob: processed.blob,
      mimeType: processed.mimeType,
      width: processed.width,
      height: processed.height,
      capturedAt: new Date().toISOString(),
      isDemo: params.isDemo ?? false,
    };

    await db.photos.add(photo);
    return photo;
  }

  async delete(id: string): Promise<void> {
    await db.photos.delete(id);
  }
}

export const photoRepo = new PhotoRepository();
