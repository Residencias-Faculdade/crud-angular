import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { retry } from 'rxjs';

import { Post } from '../domain/post.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PostRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/posts`;

  findAll(): Observable<Post[]> {
    return this.http.get<Post[]>(this.apiUrl).pipe(retry(2));
  }

  findById(postId: number): Observable<Post> {
    return this.http.get<Post>(`${this.apiUrl}/${postId}`);
  }

  create(payload: Omit<Post, 'id'>): Observable<Post> {
    return this.http.post<Post>(this.apiUrl, payload);
  }

  update(postId: number, payload: Partial<Post>): Observable<Post> {
    return this.http.put<Post>(`${this.apiUrl}/${postId}`, payload);
  }

  remove(postId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${postId}`);
  }
}
