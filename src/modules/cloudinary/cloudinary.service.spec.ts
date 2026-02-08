import { Test, type TestingModule } from '@nestjs/testing';
import { CloudinaryService } from './cloudinary.service';
import { v2 as cloudinary } from 'cloudinary';

// Mock the cloudinary module
jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CloudinaryService],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadImage', () => {
    it('should upload buffer and return url and publicId', async () => {
      const mockResult = {
        secure_url: 'https://res.cloudinary.com/test/image/upload/products/img.jpg',
        public_id: 'products/img',
      };

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_options: unknown, callback: (error: null, result: typeof mockResult) => void) => {
          return {
            end: () => {
              callback(null, mockResult);
            },
          };
        },
      );

      const buffer = Buffer.from('fake-image-data');
      const result = await service.uploadImage(buffer, 'products');

      expect(result).toEqual({
        url: 'https://res.cloudinary.com/test/image/upload/products/img.jpg',
        publicId: 'products/img',
      });
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'products',
          quality: 'auto:best',
          fetch_format: 'auto',
          resource_type: 'image',
        }),
        expect.any(Function),
      );
    });

    // Eliminate retry delays for error tests (withRetry uses exponential backoff)
    const mockSetTimeoutImmediate = (): void => {
      jest.spyOn(global, 'setTimeout').mockImplementation((fn: () => void) => {
        fn();
        return 0 as unknown as NodeJS.Timeout;
      });
    };

    it('should throw when upload fails', async () => {
      mockSetTimeoutImmediate();

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_options: unknown, callback: (error: Error, result: null) => void) => {
          return {
            end: () => {
              callback(new Error('Upload failed'), null);
            },
          };
        },
      );

      const buffer = Buffer.from('fake-image-data');

      await expect(service.uploadImage(buffer, 'products')).rejects.toThrow('Upload failed');
    });

    it('should throw after retries when cloudinary returns no result', async () => {
      mockSetTimeoutImmediate();

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_options: unknown, callback: (error: null, result: null) => void) => {
          return {
            end: () => {
              callback(null, null);
            },
          };
        },
      );

      const buffer = Buffer.from('fake-image-data');

      await expect(service.uploadImage(buffer, 'products')).rejects.toThrow(
        'Cloudinary returned no result',
      );
      // Called 3 times (initial + 2 retries)
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledTimes(3);
    });
  });

  describe('deleteImage', () => {
    it('should delete image by public ID', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });

      await service.deleteImage('products/img123');

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('products/img123');
    });
  });

  describe('deleteImages', () => {
    it('should delete multiple images in parallel', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });

      await service.deleteImages(['img1', 'img2', 'img3']);

      expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(3);
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('img1');
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('img2');
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('img3');
    });

    it('should do nothing for empty array', async () => {
      await service.deleteImages([]);

      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });

    it('should continue when some deletions fail', async () => {
      (cloudinary.uploader.destroy as jest.Mock)
        .mockResolvedValueOnce({ result: 'ok' })
        .mockRejectedValueOnce(new Error('Not found'))
        .mockResolvedValueOnce({ result: 'ok' });

      await service.deleteImages(['img1', 'img2', 'img3']);

      expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(3);
    });
  });
});
