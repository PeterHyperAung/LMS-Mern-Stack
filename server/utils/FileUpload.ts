import multer, { StorageEngine, Multer } from "multer";
import cloudinary from "./cloudinary";
import {
  UploadApiErrorResponse,
  UploadApiResponse,
  UploadStream,
} from "cloudinary";
import util from "util";

interface IStorageCreator {
  createStorage(): StorageEngine;
}

interface IStorageStrategy<T> {
  uploadFile(file: Express.Multer.File): Promise<T | undefined | Error>;
  updateFile(
    file: Express.Multer.File,
    currentImageId: string
  ): Promise<T | never>;
}

enum StorageType {
  DISK = "disk",
  MEMORY = "memory",
}

class CloudinaryStorageStrategy implements IStorageStrategy<UploadApiResponse> {
  private _storageType: StorageType = StorageType.MEMORY;

  set storageType(type: StorageType) {
    this._storageType = type;
  }

  async uploadFile(
    file: Express.Multer.File
  ): Promise<UploadApiResponse | never> {
    let imgData: UploadApiResponse | undefined;
    if (this._storageType === StorageType.DISK) {
      return await cloudinary.uploader.upload(file.path, {
        folder: "avatars",
        width: 150,
      });
    } else if (this._storageType === StorageType.MEMORY) {
      const imgData = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "avatars",
              width: 150,
            },
            (error, result) => {
              if (error) reject(error);
              resolve(result);
            }
          )
          .end(file.buffer);
      });

      return imgData as UploadApiResponse;
    } else {
      throw new Error("File upload failed: No valid file path or buffer.");
    }
  }

  async updateFile(
    file: Express.Multer.File,
    currentImageId: string
  ): Promise<UploadApiResponse | never> {
    if (this._storageType === StorageType.DISK) {
      const [imgData] = await Promise.all([
        cloudinary.uploader.upload(file.path, {
          folder: "avatars",
          width: 150,
        }),
        cloudinary.uploader.destroy(currentImageId),
      ]);
      return imgData;
    } else if (this._storageType === StorageType.MEMORY) {
      const [imgData] = await Promise.all([
        new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: "avatars",
                width: 150,
              },
              (error, result) => {
                if (error) reject(error);
                resolve(result);
              }
            )
            .end(file.buffer);
        }),
        cloudinary.uploader.destroy(currentImageId),
      ]);

      return imgData as UploadApiResponse;
    } else {
      throw new Error("File upload failed: No valid file path or buffer.");
    }
  }
}

class DiskStorageCreator implements IStorageCreator {
  createStorage(): StorageEngine {
    return multer.diskStorage({
      destination: function (req, file, cb) {
        console.log("DEST FILE", file);
        cb(null, "tmp/my-uploads");
      },
      filename: function (req, file, cb) {
        console.log("FILE", file);
        console.log(req.body);
        const filename = file.originalname.split(".").slice(0, -1).join(".");
        const extention = file.mimetype.split("/")[1];
        const uniqueSuffix =
          Date.now() + "-" + Math.round(Math.random() * 1e9) + "." + extention;
        const fullname = filename + "-" + uniqueSuffix;
        req.body = { ...req.body, avatar: fullname };
        cb(null, fullname);
      },
    });
  }
}

class MemoryStorageCreator implements IStorageCreator {
  createStorage(): StorageEngine {
    return multer.memoryStorage();
  }
}

export class FileUpload<T> {
  private storageStrategy: IStorageStrategy<T>;
  private storage: StorageEngine;
  private upload: Multer;

  constructor(storageCreator: IStorageCreator, strategy: IStorageStrategy<T>) {
    this.storageStrategy = strategy;
    this.storage = storageCreator.createStorage();
    this.upload = multer({ storage: this.storage });
  }

  public single(fieldName: string) {
    return this.upload.single(fieldName);
  }

  public async uploadFile(
    file: Express.Multer.File
  ): Promise<T | undefined | Error> {
    console.log(file);
    return await this.storageStrategy.uploadFile(file);
  }

  public async updateFile(
    file: Express.Multer.File,
    currentImageId: string
  ): Promise<T | undefined | Error> {
    console.log("INSIDE FILE", file);
    return await this.storageStrategy.updateFile(file, currentImageId);
  }

  public setStorageStrategy(strategy: IStorageStrategy<T>) {
    this.storageStrategy = strategy;
  }
}

export const diskStorageFileUpload = new FileUpload(
  new DiskStorageCreator(),
  new CloudinaryStorageStrategy()
);
export const memoryStorageFileUpload = new FileUpload(
  new MemoryStorageCreator(),
  new CloudinaryStorageStrategy()
);
