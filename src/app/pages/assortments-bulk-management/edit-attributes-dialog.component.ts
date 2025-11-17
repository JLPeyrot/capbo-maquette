import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-edit-attributes-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, MatChipsModule],
  templateUrl: './edit-attributes-dialog.component.html',
  styleUrls: ['./edit-attributes-dialog.component.scss']
})
export class EditAttributesDialogComponent implements OnInit {
  isLoading = true;
  storeAttributes: { code: string; description: string }[] = [];
  searchTerm = '';
  selectedStoreAttributeCodes: Set<string> = new Set<string>();

  constructor(
    private dialogRef: MatDialogRef<EditAttributesDialogComponent>,
    private http: HttpClient,
    @Inject(MAT_DIALOG_DATA) public data: { preSelectedStoreAttributeCodes?: string[], mode?: 'add' | 'remove' }
  ) {
    const preset = data?.preSelectedStoreAttributeCodes || [];
    this.selectedStoreAttributeCodes = new Set(preset);
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.http.get<{ attributs_csv: string[] }>(
      '/data/attributs-csv.json'
    ).subscribe(res => {
      const list = res?.attributs_csv || [];
      this.storeAttributes = list.map(code => ({ code, description: '' }));
      this.isLoading = false;
    }, _ => {
      this.storeAttributes = [];
      this.isLoading = false;
    });
  }

  get filteredStoreAttributes(): { code: string; description: string }[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.storeAttributes;
    return this.storeAttributes.filter(s =>
      s.code.toLowerCase().includes(term)
    );
  }

  toggleSelection(code: string): void {
    if (this.selectedStoreAttributeCodes.has(code)) {
      this.selectedStoreAttributeCodes.delete(code);
    } else {
      this.selectedStoreAttributeCodes.add(code);
    }
  }

  isSelected(code: string): boolean {
    return this.selectedStoreAttributeCodes.has(code);
  }

  close(): void {
    this.dialogRef.close();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onValidate(): void {
    const selected = Array.from(this.selectedStoreAttributeCodes);
    this.dialogRef.close({ selectedStoreAttributeCodes: selected });
  }

  onDelete(): void {
    const selected = Array.from(this.selectedStoreAttributeCodes);
    this.dialogRef.close({ deleteStoreAttributeCodes: selected });
  }

  onDeleteAll(): void {
    this.dialogRef.close({ deleteAllAttributes: true });
  }
}
