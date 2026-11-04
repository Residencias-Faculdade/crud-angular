import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, retry } from 'rxjs';

import { Post } from '../domain/post.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PostRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/posts`;

  findAll(): Observable<Post[]> {
    return this.http.get<Post[]>(this.apiUrl).pipe(retry(2));
  }
}
