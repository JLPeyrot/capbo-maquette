import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material-module';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient, HttpClientModule } from '@angular/common/http';

export interface ChangeLevelDialogData {
  availableLevels?: number[];
  currentLevel?: number;
}

export interface ChangeLevelDialogResult {
  selectedLevel?: number;
}

@Component({
  selector: 'app-change-level-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule, HttpClientModule],
  template: `
    <h2 mat-dialog-title>Changer le niveau</h2>
    <div mat-dialog-content class="dialog-content">
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Niveau</mat-label>
        <mat-select [(value)]="selectedLevel">
          <mat-option *ngFor="let item of levelItems" [value]="item.level">
            {{ item.level }} - {{ item.label }}
          </mat-option>
        </mat-select>
      </mat-form-field>
    </div>
    <div mat-dialog-actions align="end" class="dialog-actions">
      <button mat-stroked-button mat-dialog-close>Annuler</button>
      <button mat-flat-button color="primary" (click)="confirm()" [disabled]="!selectedLevel">Valider</button>
    </div>
  `,
  styles: [`
    .full-width { width: 100%; }
    .dialog-content { min-width: 360px; }
  `]
})
export class ChangeLevelDialogComponent implements OnInit {
  selectedLevel?: number;
  levelItems: { level: number; label: string }[] = [];

  constructor(
    public dialogRef: MatDialogRef<ChangeLevelDialogComponent, ChangeLevelDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: ChangeLevelDialogData,
    private http: HttpClient
  ) {
    const initial = data?.currentLevel;
    this.selectedLevel = initial;
  }

  ngOnInit(): void {
    const providedLevels = (this.data?.availableLevels || []).slice().sort((a, b) => a - b);
    if (providedLevels.length > 0) {
      this.levelItems = providedLevels.map(l => ({ level: l, label: this.getFallbackLabel(l) }));
      if (this.selectedLevel == null) {
        this.selectedLevel = this.levelItems[0]?.level;
      }
      return;
    }

    this.http.get<{ trunkLevels: { level: number; label: string }[] }>(`/data/trunk-levels.json`).subscribe(json => {
      const items = (json?.trunkLevels || []).slice().sort((a, b) => a.level - b.level);
      this.levelItems = items.map(i => ({ level: Number(i.level), label: String(i.label) }));
      if (this.selectedLevel == null) {
        this.selectedLevel = this.levelItems[0]?.level;
      }
    });
  }

  private getFallbackLabel(level: number): string {
    switch (level) {
      case 1: return 'Mini';
      case 2: return 'classic';
      case 3: return 'grand';
      case 4: return 'géant';
      case 5: return 'maxi';
      default: return `Niveau ${level}`;
    }
  }

  confirm(): void {
    this.dialogRef.close({ selectedLevel: this.selectedLevel });
  }
}
