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

  it('should retry twice before propagating a network error', () => {
    repository.findAll().subscribe({
      error: (error: Error) => {
        expect(error).toBeTruthy();
      },
    });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      httpMock.expectOne(apiUrl).error(new ProgressEvent('error'));
    }
  });
});
