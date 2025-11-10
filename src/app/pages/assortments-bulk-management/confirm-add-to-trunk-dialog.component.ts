import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material-module';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmAddToTrunkData {
  selectedCount: number;
  trunkName: string;
  trunkType?: string;
  level: number;
  levelLabel?: string;
}

@Component({
  selector: 'app-confirm-add-to-trunk-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './confirm-add-to-trunk-dialog.component.html',
  styleUrls: ['./confirm-add-to-trunk-dialog.component.scss']
})
export class ConfirmAddToTrunkDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ConfirmAddToTrunkDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmAddToTrunkData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
