import { Injectable } from '@nestjs/common';

export type StorageProvider = 'local' | 's3-compatible';
export type StoredObjectStatus = 'available' | 'deleted';

export interface CreateUploadTargetInput {
  tenantId: string;
  ownerUserId: string;
  filename: string;
  contentType: string;
  size: number;
}

export interface UploadTarget {
  objectId: string;
  objectKey: string;
  provider: StorageProvider;
  uploadUrl: string;
  expiresAt: string;
}

export interface StoredObject {
  id: string;
  tenantId: string;
  ownerUserId: string;
  provider: StorageProvider;
  objectKey: string;
  filename: string;
  contentType: string;
  size: number;
  status: StoredObjectStatus;
  createdAt: string;
  deletedAt?: string;
}

export interface StoredObjectQuery {
  tenantId?: string;
  ownerUserId?: string;
  status?: StoredObjectStatus;
}

@Injectable()
export class StorageService {
  private readonly objects: StoredObject[] = [];

  createUploadTarget(input: CreateUploadTargetInput): UploadTarget {
    const objectId = `object-${this.objects.length + 1}`;
    const objectKey = `${input.tenantId}/${objectId}/${this.sanitizeFilename(input.filename)}`;
    const now = Date.now();
    const object: StoredObject = {
      id: objectId,
      tenantId: input.tenantId,
      ownerUserId: input.ownerUserId,
      provider: 'local',
      objectKey,
      filename: input.filename,
      contentType: input.contentType,
      size: input.size,
      status: 'available',
      createdAt: new Date(now).toISOString()
    };
    this.objects.push(object);

    return {
      objectId,
      objectKey,
      provider: object.provider,
      uploadUrl: `/local-storage/${objectKey}`,
      expiresAt: new Date(now + 15 * 60 * 1000).toISOString()
    };
  }

  listObjects(query: StoredObjectQuery = {}): StoredObject[] {
    return this.objects
      .filter((object) => !query.tenantId || object.tenantId === query.tenantId)
      .filter((object) => !query.ownerUserId || object.ownerUserId === query.ownerUserId)
      .filter((object) => !query.status || object.status === query.status)
      .map((object) => ({ ...object }))
      .reverse();
  }

  deleteObject(tenantId: string, objectId: string): StoredObject {
    const object = this.objects.find((candidate) => candidate.tenantId === tenantId && candidate.id === objectId);
    if (!object) {
      throw new Error(`Object not found: ${objectId}`);
    }

    object.status = 'deleted';
    object.deletedAt = new Date().toISOString();
    return { ...object };
  }

  private sanitizeFilename(filename: string): string {
    return filename.trim().replace(/[^a-zA-Z0-9._-]+/g, '-');
  }
}
