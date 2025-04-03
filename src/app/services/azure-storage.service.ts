  import { Injectable } from '@angular/core';
  import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
  import { Capacitor } from '@capacitor/core';
  import { Directory, Filesystem } from '@capacitor/filesystem';
  import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
  import { Platform } from '@ionic/angular';

  @Injectable({
    providedIn: 'root'
  })
  export class AzureStorageService {
    readonly accountName = '2025topicmanager';
    readonly containerName = 'topics';

    // Mettez à jour votre SAS token avec une date d'expiration plus longue
    private readonly sasToken = "sp=racwdl&st=2025-04-02T00:45:00Z&se=2025-04-11T08:45:00Z&spr=https&sv=2024-11-04&sr=c&sig=jVrb6rVp0pDH1Cl3Im4RCDwXDtnShOJ3rH8lduP63dU%3D";

    constructor(
      private sanitizer: DomSanitizer,
      private platform: Platform
    ) {}

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
        await blockBlobClient.uploadData(await file.arrayBuffer(), {
          blobHTTPHeaders: { blobContentType: file.type }
        });

        // Log l'URL complète pour le débogage
        console.log('Image uploaded, URL:', blockBlobClient.url);

        // S'il s'agit d'un appareil mobile, nous devons aussi stocker l'image localement
        if (Capacitor.isNativePlatform()) {
          await this.saveImageLocally(blockBlobClient.url, fileName);
        }

        return blockBlobClient.url;
      } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
      }
    }

    // Nouvelle méthode pour télécharger et enregistrer l'image localement
    private async saveImageLocally(url: string, fileName: string): Promise<void> {
      try {
        // Télécharger l'image depuis Azure
        const response = await fetch(url);
        const blob = await response.blob();

        // Convertir le Blob en base64
        const base64Data = await this.blobToBase64(blob);

        // Enregistrer dans le système de fichiers local
        await Filesystem.writeFile({
          path: `topic_images/${fileName}`,
          data: base64Data,
          directory: Directory.Data,
          recursive: true
        });

        console.log('Image saved locally:', fileName);
      } catch (error) {
        console.error('Error saving image locally:', error);
      }
    }

    private blobToBase64(blob: Blob): Promise<string> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const base64 = dataUrl.split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      });
    }

    async deleteFile(filePath: string): Promise<void> {
      const containerClient = this.getContainerClient();
      const blockBlobClient = containerClient.getBlockBlobClient(filePath);

      try {
        await blockBlobClient.delete();
        console.log('File deleted successfully from Azure:', filePath);

        // Si c'est un appareil mobile, supprimer également la copie locale
        if (Capacitor.isNativePlatform()) {
          try {
            // Extraire le nom du fichier
            const fileName = filePath.split('/').pop();
            await Filesystem.deleteFile({
              path: `topic_images/${fileName}`,
              directory: Directory.Data
            });
          } catch (localError) {
            console.warn('Failed to delete local copy of the image:', localError);
          }
        }
      } catch (error) {
        console.error('Error deleting file from Azure:', error);
        throw error;
      }
    }

    // Nouvelle méthode pour obtenir l'URL d'une image qui fonctionne sur mobile et web
    async getImageUrl(imageUrl: string): Promise<SafeUrl> {
      if (!imageUrl) return '';

      // Si nous sommes sur le web, utiliser directement l'URL Azure
      if (!Capacitor.isNativePlatform()) {
        return this.sanitizer.bypassSecurityTrustUrl(imageUrl);
      }

      // Sur mobile, essayer d'abord d'accéder à l'image locale
      try {
        const fileName = imageUrl.split('/').pop()?.split('?')[0];

        if (!fileName) {
          throw new Error('Invalid file name from URL');
        }

        // Vérifier si l'image existe localement
        const localFile = await Filesystem.readFile({
          path: `topic_images/${fileName}`,
          directory: Directory.Data
        });

        // Créer une URL de données à partir du contenu base64
        const dataUrl = `data:image/jpeg;base64,${localFile.data}`;
        return this.sanitizer.bypassSecurityTrustUrl(dataUrl);

      } catch (error) {
        console.warn('Image not found locally, trying to fetch from Azure:', error);

        // Si l'image n'est pas disponible localement, essayer de la télécharger
        try {
          const fileName = imageUrl.split('/').pop()?.split('?')[0];
          if (fileName) {
            await this.saveImageLocally(imageUrl, fileName);
            // Réessayer de lire l'image locale
            const localFile = await Filesystem.readFile({
              path: `topic_images/${fileName}`,
              directory: Directory.Data
            });
            const dataUrl = `data:image/jpeg;base64,${localFile.data}`;
            return this.sanitizer.bypassSecurityTrustUrl(dataUrl);
          }
        } catch (downloadError) {
          console.error('Failed to download image:', downloadError);
        }

        // En dernier recours, essayer l'URL Azure directement
        return this.sanitizer.bypassSecurityTrustUrl(imageUrl);
      }
    }
  }
