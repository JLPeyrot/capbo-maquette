import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { MatDialogRef } from '@angular/material/dialog';

export type DeploymentTypology = 'ferme' | 'mixte' | 'ouvert';

@Component({
  selector: 'app-deployment-typology-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule],
  templateUrl: './deployment-typology-dialog.component.html',
  styleUrls: ['./deployment-typology-dialog.component.scss']
})
export class DeploymentTypologyDialogComponent {
  selected: DeploymentTypology | null = null;

  options: { value: DeploymentTypology; label: string }[] = [
    { value: 'ferme', label: 'Fermé' },
    { value: 'mixte', label: 'Mixte' },
    { value: 'ouvert', label: 'Ouvert' }
  ];

  constructor(private dialogRef: MatDialogRef<DeploymentTypologyDialogComponent>) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (!this.selected) return;
    this.dialogRef.close({ typology: this.selected });
  }
}

