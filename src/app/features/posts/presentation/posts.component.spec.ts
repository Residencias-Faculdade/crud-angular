import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { PostsComponent } from './posts.component';
import { Post } from '../domain/post.model';

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

  function createComponent(): PostsComponent {
    TestBed.configureTestingModule({
      imports: [PostsComponent],
      providers: [provideHttpClient()],
    });
    const fixture = TestBed.createComponent(PostsComponent);
    const component = fixture.componentInstance as unknown as {
      postsResource: {
        value: () => Post[] | undefined;
        isLoading: () => boolean;
        error: () => unknown;
        reload: () => void;
      };
    };
    vi.spyOn(component.postsResource, 'value').mockReturnValue(mockPosts);
    vi.spyOn(component.postsResource, 'isLoading').mockReturnValue(false);
    vi.spyOn(component.postsResource, 'error').mockReturnValue(null);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  beforeEach(() => TestBed.resetTestingModule());

  it('should create', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
    expect(component.apiPosts().length).toBe(12);
  });

  it('should paginate api posts', () => {
    const component = createComponent();
    expect(component.totalPages()).toBe(2);
    expect(component.paginatedApiPosts().length).toBe(10);
    component.nextPage();
    expect(component.currentPage()).toBe(2);
    expect(component.paginatedApiPosts().length).toBe(2);
    component.prevPage();
    expect(component.currentPage()).toBe(1);
    component.goToPage(2);
    expect(component.currentPage()).toBe(2);
    component.goToPage(99);
    expect(component.currentPage()).toBe(2);
  });

  it('should create user post', () => {
    const component = createComponent();
    component.newTitle.set('novo titulo');
    component.newBody.set('novo conteudo');
    expect(component.canCreate()).toBe(true);
    component.createPost();
    expect(component.userPosts().length).toBe(1);
    expect(component.userPosts()[0].title).toBe('novo titulo');
    expect(component.newTitle()).toBe('');
  });

  it('should not create when empty', () => {
    const component = createComponent();
    component.newTitle.set('');
    component.newBody.set('');
    expect(component.canCreate()).toBe(false);
    component.createPost();
    expect(component.userPosts().length).toBe(0);
  });

  it('should edit user post', () => {
    const component = createComponent();
    component.newTitle.set('a');
    component.newBody.set('b');
    component.createPost();
    const created = component.userPosts()[0];
    component.startEdit(created);
    expect(component.editingId()).toBe(created.id);
    component.editTitle.set('editado');
    component.editBody.set('corpo editado');
    component.saveEdit();
    expect(component.userPosts()[0].title).toBe('editado');
    expect(component.editingId()).toBeNull();
  });

  it('should cancel edit', () => {
    const component = createComponent();
    component.newTitle.set('x');
    component.newBody.set('y');
    component.createPost();
    component.startEdit(component.userPosts()[0]);
    component.cancelEdit();
    expect(component.editingId()).toBeNull();
  });

  it('should handle modal delete flow', () => {
    const component = createComponent();
    component.newTitle.set('t');
    component.newBody.set('b');
    component.createPost();
    const post = component.userPosts()[0];
    component.openDeleteModal(post);
    expect(component.showDeleteModal()).toBe(true);
    expect(component.postToDelete()?.id).toBe(post.id);
    component.confirmDelete();
    expect(component.userPosts().length).toBe(0);
    expect(component.showDeleteModal()).toBe(false);
    component.openDeleteModal(post);
    component.closeDeleteModal();
    expect(component.showDeleteModal()).toBe(false);
  });

  it('should handle confirm without selection', () => {
    const component = createComponent();
    component.confirmDelete();
    expect(component.userPosts().length).toBe(0);
  });

  it('should reload', () => {
    const component = createComponent();
    const reloadSpy = vi.spyOn(
      (component as unknown as { postsResource: { reload: () => void } }).postsResource,
      'reload',
    );
    component.fetchPosts();
    expect(reloadSpy).toHaveBeenCalled();
    expect(component.currentPage()).toBe(1);
  });
});
