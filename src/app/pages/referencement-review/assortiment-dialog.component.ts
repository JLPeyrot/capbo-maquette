import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MaterialModule } from '../../shared/material-module';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { SelectedArticleSummary } from '../referencement/referencement-selection.service';

export type AssortimentMode = 'commandable' | 'vendable';

export interface AssortimentDialogData {
  article: SelectedArticleSummary;
  mode: AssortimentMode;
  selectedCount?: number; // nombre d’articles sélectionnés (optionnel)
}

export interface AssortimentDialogResult {
  type: 'permanent' | 'catalogue' | 'promotion';
  startDate: Date | null;
  endDate: Date | null;
  mode: AssortimentMode;
  articleId: string;
}

@Component({
  selector: 'app-assortiment-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './assortiment-dialog.component.html',
  styleUrls: ['./assortiment-dialog.component.scss']
})
export class AssortimentDialogComponent {
  type: 'permanent' | 'catalogue' | 'promotion' = 'permanent';
  startDate: Date | null = new Date();
  endDate: Date | null = new Date(2099, 11, 31);

  constructor(
    private dialogRef: MatDialogRef<AssortimentDialogComponent, AssortimentDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: AssortimentDialogData
  ) {}

  get title(): string {
    return this.data.mode === 'commandable'
      ? 'Créer un assortiment commandable'
      : 'Créer un assortiment vendable';
  }

  get selectedCount(): number {
    return this.data?.selectedCount || 1;
  }

  isInvalid(): boolean {
    if (!this.startDate || !this.type) return true;
    if (this.endDate && this.startDate && this.endDate < this.startDate) return true;
    return false;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  create(): void {
    const result: AssortimentDialogResult = {
      type: this.type,
      startDate: this.startDate,
      endDate: this.endDate,
      mode: this.data.mode,
      articleId: this.data.article.id
    };
    this.dialogRef.close(result);
  }

  onTypeChanged(value: 'permanent' | 'catalogue' | 'promotion'): void {
    this.type = value;
    if (value === 'permanent') {
      this.startDate = new Date();
      this.endDate = new Date(2099, 11, 31);
    } else {
      // Pour les autres types, la date de début est obligatoire mais non pré-remplie
      this.startDate = null;
      this.endDate = null;
    }
  }
}
