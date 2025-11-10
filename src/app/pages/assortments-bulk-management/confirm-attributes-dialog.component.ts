import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material-module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmAttributesData {
  attributesCount: number;
  articlesCount: number;
  mode?: 'apply' | 'remove' | 'remove_all';
}

@Component({
  selector: 'app-confirm-attributes-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './confirm-attributes-dialog.component.html',
  styleUrls: ['./confirm-attributes-dialog.component.scss']
})
export class ConfirmAttributesDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ConfirmAttributesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmAttributesData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
