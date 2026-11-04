import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-json-control',
  templateUrl: './json-control.component.html',
  styleUrl: './json-control.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonControlComponent {
  readonly control = input.required<FormControl>();

  protected readonly text = signal('');
  protected readonly parseError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const value = this.control().value;

      this.text.set(value === null || value === undefined ? '' : JSON.stringify(value, null, 2));
    });
  }

  protected onInput(event: Event): void {
    const raw = (event.target as HTMLTextAreaElement).value;

    this.text.set(raw);

    if (!raw.trim()) {
      this.parseError.set(null);
      this.control().setValue(null);
      return;
    }

    try {
      const parsed: unknown = JSON.parse(raw);

      this.parseError.set(null);
      this.control().setValue(parsed);
      this.control().markAsDirty();
    } catch (error) {
      this.parseError.set(error instanceof Error ? error.message : 'JSON inválido');
    }
  }

  protected format(): void {
    try {
      const parsed: unknown = JSON.parse(this.text());

      this.text.set(JSON.stringify(parsed, null, 2));
      this.parseError.set(null);
    } catch (error) {
      this.parseError.set(error instanceof Error ? error.message : 'JSON inválido');
    }
  }
}
