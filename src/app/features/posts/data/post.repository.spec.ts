import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PostRepository } from './post.repository';
import { environment } from '../../../../environments/environment';
import { Post } from '../domain/post.model';

describe('PostRepository', () => {
  let repository: PostRepository;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/posts`;
  const mockPosts: Post[] = [
    { id: 1, userId: 1, title: 'title one', body: 'body one' },
    { id: 2, userId: 1, title: 'title two', body: 'body two' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PostRepository, provideHttpClient(), provideHttpClientTesting()],
    });
    repository = TestBed.inject(PostRepository);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should fetch all posts', () => {
    repository.findAll().subscribe((posts) => {
      expect(posts).toEqual(mockPosts);
    });
    const request = httpMock.expectOne(apiUrl);
    expect(request.request.method).toBe('GET');
    request.flush(mockPosts);
  });

  it('should fetch post by id', () => {
    repository.findById(1).subscribe((post) => {
      expect(post).toEqual(mockPosts[0]);
    });
    const request = httpMock.expectOne(`${apiUrl}/1`);
    expect(request.request.method).toBe('GET');
    request.flush(mockPosts[0]);
  });

  it('should create post', () => {
    const payload = { userId: 1, title: 'new', body: 'content' };
    const created: Post = { id: 101, ...payload };
    repository.create(payload).subscribe((post) => {
      expect(post).toEqual(created);
    });
    const request = httpMock.expectOne(apiUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush(created);
  });

  it('should update post', () => {
    const changes = { title: 'updated' };
    const updated: Post = { ...mockPosts[0], ...changes };
    repository.update(1, changes).subscribe((post) => {
      expect(post).toEqual(updated);
    });
    const request = httpMock.expectOne(`${apiUrl}/1`);
    expect(request.request.method).toBe('PUT');
    request.flush(updated);
  });

  it('should delete post', () => {
    repository.remove(1).subscribe((response) => {
      expect(response).toBeFalsy();
    });
    const request = httpMock.expectOne(`${apiUrl}/1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });

  it('should handle network error after retries', () => {
    repository.findAll().subscribe({
      error: (error: Error) => {
        expect(error).toBeTruthy();
      },
    });
    for (let index = 0; index < 3; index += 1) {
      const request = httpMock.expectOne(apiUrl);
      request.error(new ProgressEvent('error'));
    }
  });
});
