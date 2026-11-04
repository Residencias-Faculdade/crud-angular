import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type CopyState = 'idle' | 'copied' | 'failed';

@Component({
  selector: 'app-payload-panel',
  templateUrl: './payload-panel.component.html',
  styleUrl: './payload-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PayloadPanelComponent {
  readonly payloadJson = input.required<string>();
  readonly submittedJson = input<string | null>(null);
  readonly copyState = input<CopyState>('idle');

  readonly copy = output<void>();
}
