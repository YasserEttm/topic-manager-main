import { Injectable } from '@angular/core';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';


@Injectable({
  providedIn: 'root'
})
export class AzureStorageService {
  private readonly accountName = '2025topicmanager';
  private readonly containerName = 'topics';

  // Get a new SAS token with ALL permissions (read, write, delete, list, etc.)
  // This token should look like: ?sv=2024-11-04&ss=b&srt=sco&sp=rwdlacu&se=2025-04-30T00:00:00Z&st=2025-03-31T00:00:00Z&spr=https&sig=XXXXXXXXXX
  private readonly sasToken = "sv=2024-11-04&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2025-03-31T14:24:01Z&st=2025-03-31T06:24:01Z&spr=https&sig=hTY1fxzqG%2FXjR7MP%2FJ6F15uVmKxPzw5WcBp5N2iA6P8%3D";

  private getBlobServiceClient(): BlobServiceClient {
    const blobServiceClient = new BlobServiceClient(
      `https://${this.accountName}.blob.core.windows.net/?${this.sasToken}`
    );
    return blobServiceClient;
  }

  private getContainerClient(): ContainerClient {
    return this.getBlobServiceClient().getContainerClient(this.containerName);
  }

  async uploadFile(file: File, fileName: string): Promise<string> {
    const containerClient = this.getContainerClient();
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    try {
      await blockBlobClient.uploadData(file, {
        blobHTTPHeaders: { blobContentType: file.type }
      });
      return blockBlobClient.url;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const containerClient = this.getContainerClient();
    const fileName = fileUrl.split('/').pop() || '';
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    try {
      await blockBlobClient.delete();
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
}
