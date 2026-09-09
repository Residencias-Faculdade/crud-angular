/**
 * COMPATIBILIDADE COM ATIVIDADENGX - PostsComponent como Web Component
 * MODIFICADO: ViewEncapsulation.ShadowDom para isolar estilos quando <posts-crud>
 * e montado dentro da shell em :3000. Sem isso, CSS vazaria para a casca e vice-versa.
 * Também movido de src/app/components/posts -> src/app/features/posts/presentation
 * para Clean Architecture (domain/data/presentation) alinhada ao padrao da shell.
 */
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  signal,
} from '@angular/core';
import { httpResource } from '@angular/common/http';

import { Post } from '../domain/post.model';
import { environment } from '../../../../environments/environment';
import { ConfirmModalComponent } from '../../../shared/components/modal/confirm-modal.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-posts', // usado internamente; tag publica e 'posts-crud' definida em src/main.ts
  standalone: true,
  imports: [ConfirmModalComponent, PaginationComponent],
  templateUrl: './posts.component.html',
  styleUrl: './posts.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom, // ESSENCIAL: isola Shadow DOM para shell
})
export class PostsComponent {
  private readonly postsResource = httpResource<Post[]>(() => `${environment.apiUrl}/posts`);

  readonly apiPosts = computed(() => this.postsResource.value() ?? []);
  readonly isLoading = computed(
    () => this.postsResource.isLoading() && this.apiPosts().length === 0,
  );
  readonly errorMessage = computed(() => {
    const err = this.postsResource.error() as Error | null;
    return err ? err.message : null;
  });

  readonly userPosts = signal<Post[]>([]);
  readonly hasUserPosts = computed(() => this.userPosts().length > 0);

  readonly newTitle = signal('');
  readonly newBody = signal('');
  readonly canCreate = computed(
    () => this.newTitle().trim().length > 0 && this.newBody().trim().length > 0,
  );

  readonly editingId = signal<number | null>(null);
  readonly editTitle = signal('');
  readonly editBody = signal('');
  readonly canSaveEdit = computed(
    () => this.editTitle().trim().length > 0 && this.editBody().trim().length > 0,
  );

  readonly pageSize = 10;
  readonly currentPage = signal(1);
  readonly totalApiPosts = computed(() => this.apiPosts().length);
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalApiPosts() / this.pageSize)),
  );
  readonly paginatedApiPosts = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.apiPosts().slice(start, start + this.pageSize);
  });
  readonly pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  readonly paginationInfo = computed(() => {
    const total = this.totalApiPosts();
    if (total === 0) return 'Nenhum post';
    const start = (this.currentPage() - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage() * this.pageSize, total);
    return `${start}-${end} de ${total}`;
  });
  readonly hasPrev = computed(() => this.currentPage() > 1);
  readonly hasNext = computed(() => this.currentPage() < this.totalPages());

  readonly showDeleteModal = signal(false);
  readonly postToDelete = signal<Post | null>(null);

  fetchPosts(): void {
    this.postsResource.reload();
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextPage(): void {
    if (this.hasNext()) this.goToPage(this.currentPage() + 1);
  }

  prevPage(): void {
    if (this.hasPrev()) this.goToPage(this.currentPage() - 1);
  }

  createPost(): void {
    if (!this.canCreate()) return;

    const newPost: Post = {
      id: this.nextId(),
      userId: 1,
      title: this.newTitle().trim(),
      body: this.newBody().trim(),
    };

    this.userPosts.update((posts) => [newPost, ...posts]);
    this.newTitle.set('');
    this.newBody.set('');
  }

  startEdit(post: Post): void {
    this.editingId.set(post.id);
    this.editTitle.set(post.title);
    this.editBody.set(post.body);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editTitle.set('');
    this.editBody.set('');
  }

  saveEdit(): void {
    const id = this.editingId();
    if (id === null || !this.canSaveEdit()) return;

    this.userPosts.update((posts) =>
      posts.map((p) =>
        p.id === id ? { ...p, title: this.editTitle().trim(), body: this.editBody().trim() } : p,
      ),
    );
    this.cancelEdit();
  }

  openDeleteModal(post: Post): void {
    this.postToDelete.set(post);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.postToDelete.set(null);
  }

  confirmDelete(): void {
    const post = this.postToDelete();
    if (!post) return;
    this.userPosts.update((posts) => posts.filter((p) => p.id !== post.id));
    if (this.editingId() === post.id) this.cancelEdit();
    this.closeDeleteModal();
  }

  private nextId(): number {
    const allIds = [...this.apiPosts().map((p) => p.id), ...this.userPosts().map((p) => p.id)];
    return allIds.length ? Math.max(...allIds) + 1 : 1;
  }
}
