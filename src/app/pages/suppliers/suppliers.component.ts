import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material-module';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './suppliers.component.html',
  styleUrls: ['./suppliers.component.scss']
})
export class SuppliersComponent implements OnInit {
  @Input() createMode: boolean = false;

  suppliers = [
    { id: 1, name: 'Textile France', contact: 'contact@textile-france.com', phone: '01 23 45 67 89', status: 'Actif' },
    { id: 2, name: 'Fashion Supply', contact: 'info@fashion-supply.com', phone: '01 98 76 54 32', status: 'Actif' },
    { id: 3, name: 'EcoTex Industries', contact: 'sales@ecotex.com', phone: '01 11 22 33 44', status: 'Inactif' }
  ];

  displayedColumns: string[] = ['name', 'contact', 'phone', 'status', 'actions'];

  isCreating = false;
  createForm: FormGroup;

  constructor(private fb: FormBuilder, private snackBar: MatSnackBar) {
    this.createForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      contact: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      address: [''],
      city: [''],
      postalCode: [''],
      country: [''],
      supplierCode: ['']
    });
  }

  ngOnInit(): void {
    if (this.createMode) {
      this.isCreating = true;
    }
  }

  addSupplier(): void {
    this.isCreating = true;
  }

  editSupplier(supplier: any): void {
    console.log('Modifier le fournisseur:', supplier);
  }

  deleteSupplier(supplier: any): void {
    console.log('Supprimer le fournisseur:', supplier);
  }

  cancelCreate(): void {
    this.isCreating = false;
    this.createForm.reset();
  }

  saveSupplier(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    const v = this.createForm.value;
    const maxId = this.suppliers.length ? Math.max(...this.suppliers.map(s => s.id)) : 0;
    const newId = maxId + 1;
    this.suppliers.unshift({
      id: newId,
      name: v.name,
      contact: v.contact,
      phone: v.phone,
      status: 'Actif'
    });
    this.snackBar.open('Fournisseur créé avec succès', 'Fermer', { duration: 3000 });
    this.cancelCreate();
  }
}
