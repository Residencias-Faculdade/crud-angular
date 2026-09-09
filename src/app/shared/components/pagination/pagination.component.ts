import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    <nav class="pagination" aria-label="Paginacao">
      <button type="button" (click)="prev.emit()" [disabled]="!hasPrev()" class="btn btn-ghost">
        ‹ Anterior
      </button>
      @for (page of pageNumbers(); track page) {
        <button
          type="button"
          (click)="pageChange.emit(page)"
          [class.active]="page === currentPage()"
          class="btn btn-page"
          [attr.aria-current]="page === currentPage() ? 'page' : null"
        >
          {{ page }}
        </button>
      }
      <button type="button" (click)="next.emit()" [disabled]="!hasNext()" class="btn btn-ghost">
        Próxima ›
      </button>
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageNumbers = input.required<number[]>();
  readonly hasPrev = input.required<boolean>();
  readonly hasNext = input.required<boolean>();

  readonly pageChange = output<number>();
  readonly prev = output<void>();
  readonly next = output<void>();
}
