import { Injectable } from '@angular/core';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';


@Injectable({
  providedIn: 'root'
})
export class AzureStorageService {
  private readonly accountName = '2025topicmanager';
  private readonly containerName = 'topics';

  private readonly sasToken = "sp=racwd&st=2025-04-01T04:18:57Z&se=2025-04-01T12:18:57Z&spr=https&sv=2024-11-04&sr=c&sig=iQh55pygmxSx%2BYdxEKkhskrSWl1lynrblGG0OORFWvE%3D";

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
