import { inject, Injectable } from '@angular/core';
import { Topic, Topics } from '../models/topic';
import { Post } from '../models/post';
import { generateUUID } from '../utils/generate-uuid';
import { BehaviorSubject, catchError, combineLatest, from, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { AzureStorageService } from './azure-storage.service';

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
  
        return combineLatest([
          collectionData(whereUserIsOwnerTopics, { idField: 'id' }) as Observable<Topic[]>,
          collectionData(whereUserIsReaderTopics, { idField: 'id' }) as Observable<Topic[]>
        ]).pipe(
          map(([ownedTopics, readTopics]) => {
            // Map owned topics with isOwner flag
            const ownedWithFlag = ownedTopics.map((topic) => ({
              ...topic,
              isOwner: true,
              isReader: false
            }));
  
            
            const readWithFlag = readTopics.map((topic) => ({
              ...topic,
              isOwner: false,
              isReader: true
            }));
  
            
            const allTopics = [...ownedWithFlag, ...readWithFlag];
  
            const uniqueTopics: Topic[] = allTopics.reduce((acc: Topic[], current: Topic) => {
              const x = acc.find((item) => item.id === current.id);
              if (!x) {
                return acc.concat([current]);
              } else {
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
      map((topic: DocumentData | undefined) => {
        if (topic) {
          const topicData = topic as Topic;

          return {
            ...topicData,
            isOwner: true,
          };
        }
        return undefined;
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

  async uploadPostImage(topicId: string, postId: string, file: File): Promise<string> {
    const fileName = `topics/${topicId}/posts/${postId}/${file.name}`;
    return this.azureStorage.uploadFile(file, fileName);
  }

  async deletePostImage(imageUrl: string): Promise<void> {
    return this.azureStorage.deleteFile(imageUrl);
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
