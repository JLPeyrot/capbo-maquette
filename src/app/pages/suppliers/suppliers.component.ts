import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material-module';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './suppliers.component.html',
  styleUrls: ['./suppliers.component.scss']
})
export class SuppliersComponent implements OnInit {

  suppliers = [
    { id: 1, name: 'Textile France', contact: 'contact@textile-france.com', phone: '01 23 45 67 89', status: 'Actif' },
    { id: 2, name: 'Fashion Supply', contact: 'info@fashion-supply.com', phone: '01 98 76 54 32', status: 'Actif' },
    { id: 3, name: 'EcoTex Industries', contact: 'sales@ecotex.com', phone: '01 11 22 33 44', status: 'Inactif' }
  ];

  displayedColumns: string[] = ['name', 'contact', 'phone', 'status', 'actions'];

  constructor() { }

  ngOnInit(): void {
  }

  addSupplier(): void {
    console.log('Ajouter un nouveau fournisseur');
  }

  editSupplier(supplier: any): void {
    console.log('Modifier le fournisseur:', supplier);
  }

  deleteSupplier(supplier: any): void {
    console.log('Supprimer le fournisseur:', supplier);
  }
}