import { inject, Injectable } from '@angular/core';
import { Topic } from '../models/topic';
import { Post } from '../models/post';
import { generateUUID } from '../utils/generate-uuid';
import {  catchError, combineLatest, from, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { AzureStorageService } from './azure-storage.service';
import { Directory, Filesystem } from '@capacitor/filesystem';

import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  setDoc,
  doc,
  docData,
  query,
  where,
  DocumentData,
  arrayRemove,
  updateDoc,
  arrayUnion,
  getDoc,
  deleteDoc,
  DocumentReference
} from '@angular/fire/firestore';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class TopicService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private azureStorage = inject(AzureStorageService);
  topicsCollection = collection(this.firestore, 'topics');

  getAll(): Observable<Topic[]> {
    const user$ = this.authService.getConnectedUser();
  
    return user$.pipe(
      switchMap((user) => {
        if (!user?.email) return throwError(() => new Error('User not authenticated'));
  
        const whereUserIsOwnerTopics = query(
          this.topicsCollection,
          where('owner', '==', user.email)
        );
        const whereUserIsReaderTopics = query(
          this.topicsCollection,
          where('readers', 'array-contains', user.email)
        );
        const whereUserIsWriterTopics = query(
          this.topicsCollection,
          where('writers', 'array-contains', user.email)
        );
  
        return combineLatest([
          collectionData(whereUserIsOwnerTopics, { idField: 'id' }) as Observable<Topic[]>,
          collectionData(whereUserIsReaderTopics, { idField: 'id' }) as Observable<Topic[]>,
          collectionData(whereUserIsWriterTopics, { idField: 'id' }) as Observable<Topic[]>
        ]).pipe(
          map(([ownedTopics, readTopics, writeTopics]) => {
            // Merge and flag topics
            const allTopics = [
              ...ownedTopics.map((topic) => ({ ...topic, isOwner: true, isReader: false, isWriter: false })),
              ...readTopics.map((topic) => ({ ...topic, isOwner: false, isReader: true, isWriter: false })),
              ...writeTopics.map((topic) => ({ ...topic, isOwner: false, isReader: false, isWriter: true }))
            ];
  
            // Handle writer override: if a topic is in both read and write, mark as writer
            const uniqueTopics = allTopics.reduce((acc: Topic[], current: Topic) => {
              const existing = acc.find((item) => item.id === current.id);
              if (!existing) {
                return acc.concat([current]);
              } else {
                if (current.isWriter) {
                  existing.isWriter = true; // Override with writer status if present
                  existing.isReader = false; // Ensure it's not marked as reader if it's a writer
                }
                return acc;
              }
            }, []);
  
            return uniqueTopics;
          })
        );
      })
    );
  }


  getById(id: string): Observable<Topic | undefined> {
    const topicDoc = doc(this.firestore, 'topics', id);
  
    return docData(topicDoc, { idField: 'id' }).pipe(
      switchMap((topic: DocumentData | undefined) => {
        if (topic) {
          const topicData = topic as Topic;
  
          return this.authService.getConnectedUser().pipe(
            map((user) => {
              if (!user?.email) return undefined;
  
              // Flagging user roles for this topic
              const isOwner = topicData.owner === user.email;
              const isReader = topicData.readers?.includes(user.email);
              const isWriter = topicData.writers?.includes(user.email);
  
              return {
                ...topicData,
                isOwner,
                isReader,
                isWriter
              };
            })
          );
        }
        return of(undefined);
      })
    );
  }
  

  addTopic(name: string, posts: Post[] = []): Observable<Topic> {
    const user$ = this.authService.getConnectedUser();

    return user$.pipe(
      switchMap((user) => {
        const topicId = generateUUID();

        const newTopic: Topic = {
          id: topicId,
          name,
          posts,
          owner: user?.email || '',
          readers: [],
          writers: []
        };

        const topicRef = doc(this.firestore, 'topics', topicId);

        return from(setDoc(topicRef, { ...newTopic })).pipe(
          map(() => newTopic)
        );
      })
    );
  }

  addReader(topicId: string, readerEmail: string): Observable<void> {
    const user$ = this.authService.getConnectedUser();

    return user$.pipe(
      switchMap((user) => {
        if (user?.email !== undefined) {
          const topicRef = doc(this.firestore, 'topics', topicId);

          return from(updateDoc(topicRef, {
            readers: arrayUnion(readerEmail)
          }));
        }
        return of();
      })
    );
  }

  removeReader(topicId: string, readerEmail: string): Observable<void> {
    const user$ = this.authService.getConnectedUser();

    return user$.pipe(
      switchMap((user) => {
        if (user?.email !== undefined) {
          const topicRef = doc(this.firestore, 'topics', topicId);

          return from(updateDoc(topicRef, {
            readers: arrayRemove(readerEmail)
          }));
        }
        return of();
      })
    );
  }

  addWriter(topicId: string, writerEmail: string): Observable<void> {
    const user$ = this.authService.getConnectedUser();

    return user$.pipe(
      switchMap((user) => {
        if (user?.email !== undefined) {
          const topicRef = doc(this.firestore, 'topics', topicId);

          return from(updateDoc(topicRef, {
            writers: arrayUnion(writerEmail)
          }));
        }
        return of();
      })
    );
  }

  removeWriter(topicId: string, writerEmail: string): Observable<void> {
    const user$ = this.authService.getConnectedUser();

    return user$.pipe(
      switchMap((user) => {
        if (user?.email !== undefined) {
          const topicRef = doc(this.firestore, 'topics', topicId);

          return from(updateDoc(topicRef, {
            writers: arrayRemove(writerEmail)
          }));
        }
        return of();
      })
    );
  }

  editTopic(
    topicId: string,
    updates: Partial<Omit<Topic, 'id' | 'owner'>>
  ): Observable<void> {
    const user$ = this.authService.getConnectedUser();

    return user$.pipe(
      switchMap((user) => {
        if (!user?.email) return throwError(() => new Error('User not authenticated'));

        const topicRef = doc(this.firestore, 'topics', topicId);

        return from(getDoc(topicRef)).pipe(
          switchMap((topicSnapshot) => {
            if (!topicSnapshot.exists()) {
              return throwError(() => new Error('Topic not found'));
            }

            const topicData = topicSnapshot.data() as Topic;

            // Vérification des permissions
            if (topicData.owner !== user.email && !(topicData.writers || []).includes(user.email ?? '')) {
              return throwError(() => new Error('Permission denied'));
            }

            return from(updateDoc(topicRef, updates));
          }),
          catchError((error) => {
            console.error('Error updating topic:', error);
            return throwError(() => error);
          })
        );
      })
    );
  }

  removeTopic(topicId: string): Observable<void> {
    const user$ = this.authService.getConnectedUser();

    return user$.pipe(
      switchMap((user) => {
        if (!user?.email) return throwError(() => new Error('User not authenticated'));

        const topicRef = doc(this.firestore, 'topics', topicId);

        return from(getDoc(topicRef)).pipe(
          switchMap((topicSnapshot) => {
            if (!topicSnapshot.exists()) {
              return throwError(() => new Error('Topic not found'));
            }

            const topicData = topicSnapshot.data() as Topic;

            if (topicData.owner !== user.email) {
              return throwError(() => new Error('Permission denied: Only the owner can delete this topic'));
            }

            return from(deleteDoc(topicRef));
          })
        );
      })
    );
  }


  async uploadPostImage(topicId: string, postId: string, file: File | Blob): Promise<string> {
    if (Capacitor.isNativePlatform()) {
      throw new Error('Image upload is disabled on mobile devices');
    }

    const fileToUpload = file instanceof File ? file :
      new File([file], `image_${Date.now()}.jpg`, { type: 'image/jpeg' });

    const sanitizedOriginalName = fileToUpload.name.toLowerCase().replace(/[^a-z0-9_.-]/g, '_');
    const fileName = `${postId}_${Date.now()}_${sanitizedOriginalName}`;

    try {
      const url = await this.azureStorage.uploadFile(fileToUpload, `${topicId}/${fileName}`);
      console.log('[uploadPostImage] Image uploaded at:', url);
      return url;
    } catch (err) {
      console.error('[uploadPostImage] Upload failed:', err);
      throw err;
    }
  }


  async deletePostImage(imageUrl: string): Promise<void> {
    try {
      // Vérifier si c'est une URL Azure
      if (imageUrl.includes('.blob.core.windows.net')) {
        // Extraire le chemin du fichier de l'URL Azure
        const urlParts = imageUrl.split('/');
        const containerIndex = urlParts.findIndex(part => part === this.azureStorage.containerName);

        if (containerIndex !== -1 && containerIndex < urlParts.length - 1) {
          // Obtenir le chemin du fichier après le nom du conteneur
          const filePath = urlParts.slice(containerIndex + 1).join('/').split('?')[0];

          // Supprimer le fichier sur Azure
          await this.azureStorage.deleteFile(filePath);
          console.log('Image supprimée d\'Azure:', filePath);
        } else {
          console.error('Format d\'URL Azure invalide:', imageUrl);
        }
      } else if (Capacitor.isNativePlatform()) {
        // Supprimer le fichier sur le système de fichiers natif
        try {
          await Filesystem.deleteFile({
            path: imageUrl,
            directory: Directory.Data
          });
          console.log('Image supprimée du système de fichiers natif:', imageUrl);
        } catch (error) {
          console.error('Erreur lors de la suppression de l\'image du système de fichiers:', error);
        }
      } else {
        // Sur le web avec une data URL ou autre type d'URL
        console.log('Image non supprimée (format non géré):', imageUrl.substring(0, 30) + '...');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'image:', error);
    }
  }

  getPostById(topicId: string, postId: string): Observable<Post | undefined> {
    const topicRef = doc(this.firestore, 'topics', topicId);

    return docData(topicRef).pipe(
      map((topic: DocumentData | undefined) => {
        if (topic) {
          const posts = topic['posts'] as Post[];
          return posts.find((post) => post.id === postId);
        }
        return undefined;
      })
    );
  }

  addPost(topicId: string, post: Omit<Post, 'id'>): Observable<Post> {
    const user$ = this.authService.getConnectedUser();

    return user$.pipe(
      switchMap((user) => {
        if (!user?.email) return throwError(() => new Error('User not authenticated'));

        const topicRef = doc(this.firestore, 'topics', topicId);
        const postId = generateUUID();
        const newPost: Post = { ...post, id: postId };

        return from(updateDoc(topicRef, {
          posts: arrayUnion(newPost)
        })).pipe(
          map(() => newPost)
        );
      })
    );
  }

  editPost(topicId: string, post: Post): Observable<void> {
    const user$ = this.authService.getConnectedUser();

    return user$.pipe(
      switchMap((user) => {
        if (!user?.email) return throwError(() => new Error('User not authenticated'));

        const topicRef = doc(this.firestore, 'topics', topicId);

        return from(getDoc(topicRef)).pipe(
          switchMap((topicSnapshot) => {
            if (!topicSnapshot.exists()) {
              return throwError(() => new Error('Topic not found'));
            }

            const topicData = topicSnapshot.data() as Topic;
            const updatedPosts = topicData.posts.map((_post) =>
              _post.id === post.id ? { ...post } : _post
            );

            return from(updateDoc(topicRef, { posts: updatedPosts }));
          })
        );
      })
    );
  }

  removePost(topicId: string, post: Post): Observable<void> {
    const user$ = this.authService.getConnectedUser();

    return user$.pipe(
      switchMap((user) => {
        if (!user?.email) {
          console.error('User not authenticated');
          return throwError(() => new Error('User not authenticated'));
        }

        const topicRef = doc(this.firestore, 'topics', topicId);

        return from(getDoc(topicRef)).pipe(
          switchMap((topicSnapshot) => {
            if (!topicSnapshot.exists()) {
              console.error('Topic not found');
              return throwError(() => new Error('Topic not found'));
            }

            const topicData = topicSnapshot.data() as Topic;
            const updatedPosts = topicData.posts.filter((_post) => _post.id !== post.id);

            // Mettre à jour le document Firestore avec le nouveau tableau de posts
            return from(updateDoc(topicRef, { posts: updatedPosts }));
          }),
          tap(() => {
            console.log('Post removed successfully');
          }),
          catchError((err) => {
            console.error('Failed to remove post:', err);
            return throwError(() => err);
          })
        );
      })
    );
  }
}
