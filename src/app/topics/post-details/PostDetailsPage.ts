import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TopicService } from '../../services/topic.service';
import { map, switchMap } from 'rxjs';
import { Post } from 'src/app/models/post';

@Component({
  selector: 'app-post-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="post">
      <h2>{{ post.name }}</h2>
      <p>{{ post.description }}</p>
    </div>
    <div *ngIf="!post">
      <p>Post not found.</p>
    </div>
  `,
})
export class PostDetailsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly topicService = inject(TopicService);

  post: Post | undefined;

  ngOnInit(): void {
    this.route.params
      .pipe(
        switchMap((params) => {
          const topicId = params['topicId'];
          const postId = params['postId'];
          return this.topicService.getPostById(topicId, postId);
        })
      )
      .subscribe((post) => {
        this.post = post;
      });
  }
}
