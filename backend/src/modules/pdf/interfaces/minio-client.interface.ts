import { Stream } from 'stream';

export interface IMinioClient {
  bucketExists(bucketName: string): Promise<boolean>;
  makeBucket(bucketName: string): Promise<void>;
  putObject(
    bucketName: string,
    objectName: string,
    data: Buffer,
    size: number,
    metaData: { [key: string]: string },
  ): Promise<void>;
  getObject(bucketName: string, objectName: string): Promise<Stream>;
  removeObject(bucketName: string, objectName: string): Promise<void>;
  presignedGetObject(
    bucketName: string,
    objectName: string,
    expires: number,
  ): Promise<string>;
  statObject(bucketName: string, objectName: string): Promise<any>;
  setBucketPolicy(bucketName: string, policy: string): Promise<void>;
  listObjects(bucketName: string): AsyncIterableIterator<{
    name: string;
    lastModified: Date;
    size: number;
  }>;
}
