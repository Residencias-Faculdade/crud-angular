import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  signal,
} from '@angular/core';

import { PostsStore } from '../application/posts.store';
import { Post } from '../domain/post.model';
import { ConfirmModalComponent } from '../../../shared/components/modal/confirm-modal.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-posts',
  imports: [ConfirmModalComponent, PaginationComponent],
  templateUrl: './posts.component.html',
  styleUrl: './posts.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  providers: [PostsStore],
})
export class PostsComponent {
  protected readonly store = inject(PostsStore);

  protected readonly newTitle = signal('');
  protected readonly newBody = signal('');
  protected readonly canCreate = computed(
    () => this.newTitle().trim().length > 0 && this.newBody().trim().length > 0,
  );

  protected readonly editingId = signal<number | null>(null);
  protected readonly editTitle = signal('');
  protected readonly editBody = signal('');
  protected readonly canSaveEdit = computed(
    () => this.editTitle().trim().length > 0 && this.editBody().trim().length > 0,
  );

  protected readonly showDeleteModal = signal(false);
  protected readonly postToDelete = signal<Post | null>(null);
  protected readonly deleteMessage = computed(() => {
    const post = this.postToDelete();

    return post
      ? `Tem certeza que deseja deletar o post '${post.title}' (#${post.id})? Essa acao nao pode ser desfeita.`
      : '';
  });

  protected onNewTitleInput(event: Event): void {
    this.newTitle.set(inputValue(event));
  }

  protected onNewBodyInput(event: Event): void {
    this.newBody.set(inputValue(event));
  }

  protected onEditTitleInput(event: Event): void {
    this.editTitle.set(inputValue(event));
  }

  protected onEditBodyInput(event: Event): void {
    this.editBody.set(inputValue(event));
  }

  protected createPost(): void {
    if (!this.canCreate()) return;

    this.store.create({ title: this.newTitle(), body: this.newBody() });
    this.newTitle.set('');
    this.newBody.set('');
  }

  protected startEdit(post: Post): void {
    this.editingId.set(post.id);
    this.editTitle.set(post.title);
    this.editBody.set(post.body);
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.editTitle.set('');
    this.editBody.set('');
  }

  protected saveEdit(): void {
    const id = this.editingId();

    if (id === null || !this.canSaveEdit()) return;

    this.store.update(id, { title: this.editTitle(), body: this.editBody() });
    this.cancelEdit();
  }

  protected openDeleteModal(post: Post): void {
    this.postToDelete.set(post);
    this.showDeleteModal.set(true);
  }

  protected closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.postToDelete.set(null);
  }

  protected confirmDelete(): void {
    const post = this.postToDelete();

    if (!post) return;

    this.store.remove(post.id);

    if (this.editingId() === post.id) this.cancelEdit();

    this.closeDeleteModal();
  }

  protected reload(): void {
    this.store.reload();
  }

  protected goToPage(page: number): void {
    this.store.goToPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected nextPage(): void {
    if (this.store.hasNext()) this.goToPage(this.store.currentPage() + 1);
  }

  protected prevPage(): void {
    if (this.store.hasPrev()) this.goToPage(this.store.currentPage() - 1);
  }
}

function inputValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
}
