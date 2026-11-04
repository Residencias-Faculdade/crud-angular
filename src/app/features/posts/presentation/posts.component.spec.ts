import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WritableSignal } from '@angular/core';
import { of } from 'rxjs';

import { PostRepository } from '../data/post.repository';
import { Post } from '../domain/post.model';
import { PostsStore } from '../application/posts.store';
import { PostsComponent } from './posts.component';

interface PostsComponentApi {
  store: PostsStore;
  newTitle: WritableSignal<string>;
  newBody: WritableSignal<string>;
  editingId: WritableSignal<number | null>;
  editTitle: WritableSignal<string>;
  editBody: WritableSignal<string>;
  showDeleteModal: WritableSignal<boolean>;
  postToDelete: WritableSignal<Post | null>;
  createPost(): void;
  startEdit(post: Post): void;
  saveEdit(): void;
  cancelEdit(): void;
  openDeleteModal(post: Post): void;
  confirmDelete(): void;
  closeDeleteModal(): void;
  reload(): void;
  nextPage(): void;
  prevPage(): void;
  goToPage(page: number): void;
}

describe('PostsComponent', () => {
  const mockPosts: Post[] = Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    userId: 1,
    title: `title ${index + 1}`,
    body: `body ${index + 1}`,
  }));

  beforeAll(() => {
    Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
  });

  beforeEach(() => TestBed.resetTestingModule());

  async function createComponent(): Promise<{
    fixture: ComponentFixture<PostsComponent>;
    component: PostsComponentApi;
  }> {
    TestBed.configureTestingModule({
      imports: [PostsComponent],
      providers: [{ provide: PostRepository, useValue: { findAll: () => of(mockPosts) } }],
    });

    const fixture = TestBed.createComponent(PostsComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    return {
      fixture,
      component: fixture.componentInstance as unknown as PostsComponentApi,
    };
  }

  it('should create and load api posts', async () => {
    const { component } = await createComponent();

    expect(component).toBeTruthy();
    await vi.waitFor(() => expect(component.store.posts().length).toBe(12));
  });

  it('should paginate api posts', async () => {
    const { component } = await createComponent();
    await vi.waitFor(() => expect(component.store.totalPages()).toBe(2));

    expect(component.store.pagePosts().length).toBe(10);

    component.nextPage();

    expect(component.store.currentPage()).toBe(2);
    expect(component.store.pagePosts().length).toBe(2);

    component.prevPage();

    expect(component.store.currentPage()).toBe(1);

    component.goToPage(2);
    component.goToPage(99);

    expect(component.store.currentPage()).toBe(2);
  });

  it('should create a draft post', async () => {
    const { component } = await createComponent();

    component.newTitle.set('novo titulo');
    component.newBody.set('novo conteudo');
    component.createPost();

    expect(component.store.drafts()).toHaveLength(1);
    expect(component.store.drafts()[0].title).toBe('novo titulo');
    expect(component.newTitle()).toBe('');
  });

  it('should not create a draft when fields are empty', async () => {
    const { component } = await createComponent();

    component.newTitle.set('   ');
    component.newBody.set('');
    component.createPost();

    expect(component.store.drafts()).toHaveLength(0);
  });

  it('should edit a draft post', async () => {
    const { component } = await createComponent();

    component.newTitle.set('titulo');
    component.newBody.set('corpo');
    component.createPost();

    const draft = component.store.drafts()[0];
    component.startEdit(draft);
    component.editTitle.set('editado');
    component.editBody.set('corpo editado');
    component.saveEdit();

    expect(component.store.drafts()[0].title).toBe('editado');
    expect(component.editingId()).toBeNull();
  });

  it('should cancel an edit', async () => {
    const { component } = await createComponent();

    component.newTitle.set('titulo');
    component.newBody.set('corpo');
    component.createPost();
    component.startEdit(component.store.drafts()[0]);
    component.cancelEdit();

    expect(component.editingId()).toBeNull();
  });

  it('should delete a draft through the confirmation modal', async () => {
    const { component } = await createComponent();

    component.newTitle.set('titulo');
    component.newBody.set('corpo');
    component.createPost();

    const draft = component.store.drafts()[0];
    component.openDeleteModal(draft);

    expect(component.showDeleteModal()).toBe(true);
    expect(component.postToDelete()?.id).toBe(draft.id);

    component.confirmDelete();

    expect(component.store.drafts()).toHaveLength(0);
    expect(component.showDeleteModal()).toBe(false);
  });

  it('should ignore confirmation without a selected post', async () => {
    const { component } = await createComponent();

    component.confirmDelete();

    expect(component.store.drafts()).toHaveLength(0);
  });

  it('should reload posts and reset pagination', async () => {
    const { component } = await createComponent();
    await vi.waitFor(() => expect(component.store.totalPages()).toBe(2));

    component.goToPage(2);
    component.reload();

    expect(component.store.currentPage()).toBe(1);
  });
});
