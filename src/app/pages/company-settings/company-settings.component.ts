import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';

@Component({
  selector: 'app-company-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './company-settings.component.html',
  styleUrls: ['./company-settings.component.scss']
})
export class CompanySettingsComponent {
  sliders: { value: number; name: string }[] = [];
  min = 0;
  max = 500;
  step = 1;
  defaultMaxName: string = '';
  dragIndex: number | null = null;
  @ViewChild('track') trackEl!: ElementRef<HTMLDivElement>;
  constructor(private snackBar: MatSnackBar) {}

  formatArea(value: number): string {
    return `${value} m²`;
  }

  addSlider(): void {
    const last = this.sliders[this.sliders.length - 1]?.value ?? this.min;
    let next = last + 50;
    if (next <= last) next = last + 1;
    this.sliders.push({ value: next, name: '' });
    this.updateMax();
  }

  getPercent(value: number): number {
    const clamped = Math.min(Math.max(value, this.min), this.max);
    return ((clamped - this.min) / (this.max - this.min)) * 100;
  }

  onValueChange(index: number, value: number): void {
    if (value === null || value === undefined || isNaN(Number(value))) return;
    const isLast = index === this.sliders.length - 1;
    let v = Math.max(this.min, Math.round(Number(value)));
    const prev = index > 0 ? this.sliders[index - 1].value : this.min - 1;
    if (index > 0 && v <= prev) v = prev + 1;
    if (!isLast) v = Math.min(this.max, v);
    this.sliders[index].value = v;
    if (isLast) this.updateMax();
  }

  onMaxChange(value: number): void {
    if (value === null || value === undefined || isNaN(Number(value))) return;
    const v = Math.max(this.min + 1, Math.round(Number(value)));
    this.max = v;
    this.sliders = this.sliders.map(s => ({ ...s, value: Math.min(s.value, this.max) }));
  }

  onHandleDown(index: number, ev: PointerEvent): void {
    this.dragIndex = index;
    const t = ev.target as Element;
    if ((t as any).setPointerCapture) {
      (t as any).setPointerCapture(ev.pointerId);
    }
  }

  onPointerMove(ev: PointerEvent): void {
    if (this.dragIndex === null) return;
    const rect = this.trackEl?.nativeElement.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(rect.left, Math.min(rect.right, ev.clientX));
    const ratio = (x - rect.left) / rect.width;
    let val = Math.round(this.min + ratio * (this.max - this.min));
    const idx = this.dragIndex;
    const prev = idx > 0 ? this.sliders[idx - 1].value : this.min - 1;
    if (idx > 0 && val <= prev) val = Math.min(this.max, prev + 1);
    this.sliders[idx].value = val;
    if (idx === this.sliders.length - 1) this.updateMax();
  }

  onPointerUp(): void {
    this.dragIndex = null;
  }

  removeSlider(index: number): void {
    if (index < 0 || index >= this.sliders.length) return;
    this.sliders.splice(index, 1);
    this.updateMax();
  }

  private updateMax(): void {
    const last = this.sliders[this.sliders.length - 1]?.value ?? this.min + 1;
    this.max = Math.max(this.min + 1, last + 50);
  }

  saveSettings(): void {
    const sizes = [{ value: this.min, name: this.defaultMaxName }, ...this.sliders];
    const payload = { min: this.min, sizes };
    try {
      localStorage.setItem('company-store-sizes', JSON.stringify(payload));
      this.snackBar.open('Paramètres enregistrés', 'Fermer', { duration: 3000 });
    } catch {}
  }
}
