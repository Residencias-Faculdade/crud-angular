import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PostRepository } from '../data/post.repository';
import { Post } from '../domain/post.model';
import { PostsStore } from './posts.store';

describe('PostsStore', () => {
  const mockPosts: Post[] = Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    userId: 1,
    title: `title ${index + 1}`,
    body: `body ${index + 1}`,
  }));

  let store: PostsStore;
  let repository: { findAll: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repository = { findAll: vi.fn().mockReturnValue(of(mockPosts)) };

    TestBed.configureTestingModule({
      providers: [PostsStore, { provide: PostRepository, useValue: repository }],
    });

    store = TestBed.inject(PostsStore);
  });

  it('loads posts from the repository', async () => {
    await vi.waitFor(() => expect(store.posts().length).toBe(12));

    expect(repository.findAll).toHaveBeenCalled();
    expect(store.totalPosts()).toBe(12);
  });

  it('paginates api posts', async () => {
    await vi.waitFor(() => expect(store.totalPages()).toBe(2));

    expect(store.pagePosts().length).toBe(10);
    expect(store.paginationInfo()).toBe('1-10 de 12');

    store.goToPage(2);

    expect(store.currentPage()).toBe(2);
    expect(store.pagePosts().length).toBe(2);
    expect(store.paginationInfo()).toBe('11-12 de 12');

    store.goToPage(99);

    expect(store.currentPage()).toBe(2);
  });

  it('creates, updates and removes drafts', () => {
    store.create({ title: 'novo titulo', body: 'novo conteudo' });

    expect(store.drafts()).toHaveLength(1);
    expect(store.drafts()[0]).toMatchObject({ title: 'novo titulo', body: 'novo conteudo' });

    const draftId = store.drafts()[0].id;
    store.update(draftId, { title: 'editado', body: 'corpo editado' });

    expect(store.drafts()[0]).toMatchObject({ title: 'editado', body: 'corpo editado' });

    store.remove(draftId);

    expect(store.drafts()).toHaveLength(0);
  });

  it('resets pagination when reloading', async () => {
    await vi.waitFor(() => expect(store.totalPages()).toBe(2));

    store.goToPage(2);
    store.reload();

    expect(store.currentPage()).toBe(1);
  });
});
