import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';

export interface ArticleDetailsData {
  id: string;
  code: string;
  designation: string;
  supplierCode?: string;
  internalCode?: string;
  designationShort?: string;
  designationLong?: string;
  rayon?: string;
  famille?: string;
  sousFamille?: string;
  supplierPrincipal?: string;
  supplierRef?: string;
  purchasePriceHT?: number;
  deliveryLeadDays?: number;
  moq?: number;
  supplierPackaging?: string;
  salePriceTTC?: number;
  marginPercent?: number;
  category?: string;
  activeStatus?: string;
  unitSale?: string;
  discounts?: string;
  stockAvailable?: number;
  stockMinimum?: number;
  location?: string;
  weightKg?: number | null;
  volumeL?: number | null;
  dimensions?: string;
  lotManagement?: string;
  barcode?: string;
  secondarySupplier?: string;
}

@Component({
  selector: 'article-details-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatTabsModule, MatIconModule],
  templateUrl: './article-details-dialog.component.html',
  styleUrls: ['./article-details-dialog.component.scss']
})
export class ArticleDetailsDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ArticleDetailsData) {}
}
