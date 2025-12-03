import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TrunksService, TrunkOption } from '../../services/trunks.service';

interface AddToTrunkDialogData {
  selectedCount: number;
  selectedTrunkId?: string | null;
  mode?: 'levelOnly' | 'full';
}

@Component({
  selector: 'app-add-to-trunk-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule],
  templateUrl: './add-to-trunk-dialog.component.html',
  styleUrls: ['./add-to-trunk-dialog.component.scss']
})
export class AddToTrunkDialogComponent implements OnInit {
  trunks: TrunkOption[] = [];

  levels: number[] = [1, 2, 3, 4, 5];

  levelLabels: Record<number, string> = {
    1: 'Mini',
    2: 'classic',
    3: 'grand',
    4: 'géant',
    5: 'maxi'
  };

  selectedTrunkId: string | null = null;
  selectedLevel: number | null = null;
  selectedDeploymentTypology: 'ferme' | 'mixte' | 'ouvert' = 'ferme';
  showTrunkSelection: boolean = true;
  showTypologySelection: boolean = true;

  constructor(
    private dialogRef: MatDialogRef<AddToTrunkDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddToTrunkDialogData,
    private trunksService: TrunksService
  ) {}

  ngOnInit(): void {
    this.trunksService.getTrunkOptions().subscribe(options => {
      this.trunks = options;
    });
    if (typeof this.data.selectedTrunkId !== 'undefined') {
      this.selectedTrunkId = this.data.selectedTrunkId || null;
      this.showTrunkSelection = false;
    }
    if (this.data.mode === 'levelOnly') {
      this.showTrunkSelection = false;
      this.showTypologySelection = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if ((this.showTrunkSelection && !this.selectedTrunkId) || !this.selectedLevel) {
      return;
    }
    const trunk = this.trunks.find(t => t.id === this.selectedTrunkId);
    this.dialogRef.close({
      trunkId: this.selectedTrunkId,
      trunkName: trunk?.name || 'Tronc',
      trunkType: trunk?.type || 'TAC',
      level: this.selectedLevel,
      levelLabel: this.getLevelLabel(this.selectedLevel),
      deploymentTypology: this.selectedDeploymentTypology
    });
  }

  getLevelLabel(level: number): string {
    return this.levelLabels[level] || '';
  }
}
