import { Injectable, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { PostRepository } from '../data/post.repository';
import { Post } from '../domain/post.model';

const PAGE_SIZE = 10;

export interface PostDraft {
  title: string;
  body: string;
}

@Injectable()
export class PostsStore {
  private readonly repository = inject(PostRepository);
  private readonly postsResource = rxResource({ stream: () => this.repository.findAll() });

  readonly posts = computed(() => this.postsResource.value() ?? []);
  readonly isLoading = computed(() => this.postsResource.isLoading() && this.posts().length === 0);
  readonly errorMessage = computed(() => {
    const error = this.postsResource.error();

    if (!error) return null;

    return error instanceof Error ? error.message : String(error);
  });

  readonly drafts = signal<Post[]>([]);
  readonly hasDrafts = computed(() => this.drafts().length > 0);

  readonly pageSize = PAGE_SIZE;
  readonly currentPage = signal(1);
  readonly totalPosts = computed(() => this.posts().length);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalPosts() / PAGE_SIZE)));
  readonly pagePosts = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.posts().slice(start, start + PAGE_SIZE);
  });
  readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1),
  );
  readonly paginationInfo = computed(() => {
    const total = this.totalPosts();

    if (total === 0) return 'Nenhum post';

    const start = (this.currentPage() - 1) * PAGE_SIZE + 1;
    const end = Math.min(this.currentPage() * PAGE_SIZE, total);

    return `${start}-${end} de ${total}`;
  });
  readonly hasPrev = computed(() => this.currentPage() > 1);
  readonly hasNext = computed(() => this.currentPage() < this.totalPages());

  reload(): void {
    this.postsResource.reload();
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;

    this.currentPage.set(page);
  }

  create(draft: PostDraft): void {
    const post: Post = {
      id: this.nextId(),
      userId: 1,
      title: draft.title.trim(),
      body: draft.body.trim(),
    };

    this.drafts.update((posts) => [post, ...posts]);
  }

  update(postId: number, draft: PostDraft): void {
    this.drafts.update((posts) =>
      posts.map((post) =>
        post.id === postId ? { ...post, title: draft.title.trim(), body: draft.body.trim() } : post,
      ),
    );
  }

  remove(postId: number): void {
    this.drafts.update((posts) => posts.filter((post) => post.id !== postId));
  }

  private nextId(): number {
    const ids = [...this.posts(), ...this.drafts()].map((post) => post.id);

    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }
}
