import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';

export interface Article {
  id: string;
  ean: string;
  libelle: string;
  fournisseur: string;
  famille: string;
  prixUnitaire: number;
  stock: number;
  hasAssortment: boolean;
  selected?: boolean;
  assortmentType?: 'commandable' | 'vendable' | 'both';
  trunkAssociation?: string;
}

export interface AssortmentCreation {
  articleId: string;
  type: 'commandable' | 'vendable' | 'both';
  trunkId?: string;
}

@Component({
  selector: 'app-create-assortments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './create-assortments.component.html',
  styleUrls: ['./create-assortments.component.scss']
})
export class CreateAssortmentsComponent implements OnInit {
  searchForm: FormGroup;
  articles: Article[] = [];
  filteredArticles: Article[] = [];
  displayedColumns: string[] = ['select', 'ean', 'libelle', 'fournisseur', 'famille', 'prixUnitaire'];
  selection = new SelectionModel<Article>(true, []);
  
  // Options pour les filtres
  fournisseurs: string[] = ['Fournisseur A', 'Fournisseur B', 'Fournisseur C'];
  familles: string[] = ['Électronique', 'Textile', 'Alimentaire', 'Cosmétique'];
  trunks: any[] = [
    { id: 'TAN001', name: 'Tronc Alimentaire Nord' },
    { id: 'TAC002', name: 'Tronc Alimentaire Centre' },
    { id: 'TEN003', name: 'Tronc Électronique Nord' }
  ];

  // État du panneau d'action
  showActionPanel = false;
  selectedAssortments: AssortmentCreation[] = [];

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.searchForm = this.fb.group({
      searchTerm: [''],
      fournisseur: [''],
      famille: [''],
      hideWithAssortment: [true]
    });
  }

  ngOnInit(): void {
    this.loadArticles();
    this.setupFormSubscriptions();
  }

  private loadArticles(): void {
    // Simulation de données d'articles
    this.articles = [
      {
        id: '1',
        ean: '3760123456789',
        libelle: 'Smartphone Galaxy S24',
        fournisseur: 'Fournisseur A',
        famille: 'Électronique',
        prixUnitaire: 899.99,
        stock: 25,
        hasAssortment: false
      },
      {
        id: '2',
        ean: '3760987654321',
        libelle: 'T-shirt Coton Bio',
        fournisseur: 'Fournisseur B',
        famille: 'Textile',
        prixUnitaire: 29.99,
        stock: 150,
        hasAssortment: true
      },
      {
        id: '3',
        ean: '3760456789123',
        libelle: 'Café Bio Équitable 1kg',
        fournisseur: 'Fournisseur C',
        famille: 'Alimentaire',
        prixUnitaire: 12.50,
        stock: 80,
        hasAssortment: false
      },
      {
        id: '4',
        ean: '3760789123456',
        libelle: 'Crème Hydratante Visage',
        fournisseur: 'Fournisseur A',
        famille: 'Cosmétique',
        prixUnitaire: 24.90,
        stock: 60,
        hasAssortment: false
      },
      {
        id: '5',
        ean: '3760321654987',
        libelle: 'Casque Audio Bluetooth',
        fournisseur: 'Fournisseur B',
        famille: 'Électronique',
        prixUnitaire: 149.99,
        stock: 35,
        hasAssortment: true
      }
    ];
    
    this.applyFilters();
  }

  private setupFormSubscriptions(): void {
    this.searchForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  applyFilters(): void {
    const formValue = this.searchForm.value;
    let filtered = [...this.articles];

    // Filtre par terme de recherche (EAN ou libellé)
    if (formValue.searchTerm) {
      const searchTerm = formValue.searchTerm.toLowerCase();
      filtered = filtered.filter(article => 
        article.ean.toLowerCase().includes(searchTerm) ||
        article.libelle.toLowerCase().includes(searchTerm)
      );
    }

    // Filtre par fournisseur
    if (formValue.fournisseur) {
      filtered = filtered.filter(article => article.fournisseur === formValue.fournisseur);
    }

    // Filtre par famille
    if (formValue.famille) {
      filtered = filtered.filter(article => article.famille === formValue.famille);
    }

    // Filtre pour masquer les articles avec assortiment
    if (formValue.hideWithAssortment) {
      filtered = filtered.filter(article => !article.hasAssortment);
    }

    this.filteredArticles = filtered;
  }

  clearFilters(): void {
    this.searchForm.reset({
      searchTerm: '',
      fournisseur: '',
      famille: '',
      hideWithAssortment: true
    });
  }

  // Gestion de la sélection
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.filteredArticles.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    this.isAllSelected() ?
      this.selection.clear() :
      this.filteredArticles.forEach(row => this.selection.select(row));
    
    this.updateActionPanel();
  }

  onSelectionChange(): void {
    this.updateActionPanel();
  }

  private updateActionPanel(): void {
    this.showActionPanel = this.selection.selected.length > 0;
    
    // Initialiser les configurations d'assortiment pour les nouveaux éléments sélectionnés
    this.selectedAssortments = this.selection.selected.map(article => {
      const existing = this.selectedAssortments.find(a => a.articleId === article.id);
      return existing || {
        articleId: article.id,
        type: 'both' as 'commandable' | 'vendable' | 'both'
      };
    });
  }

  updateAssortmentType(articleId: string, type: 'commandable' | 'vendable' | 'both'): void {
    const assortment = this.selectedAssortments.find(a => a.articleId === articleId);
    if (assortment) {
      assortment.type = type;
    }
  }

  updateTrunkAssociation(articleId: string, trunkId: string): void {
    const assortment = this.selectedAssortments.find(a => a.articleId === articleId);
    if (assortment) {
      assortment.trunkId = trunkId || undefined;
    }
  }

  createAssortments(): void {
    if (this.selection.selected.length === 0) {
      this.snackBar.open('Aucun article sélectionné', 'Fermer', { duration: 3000 });
      return;
    }

    // Rediriger vers la page d'enrichissement d'assortiment
    this.router.navigate(['/enrichment-assortment']);
  }

  getSelectedArticle(articleId: string): Article | undefined {
    return this.selection.selected.find(article => article.id === articleId);
  }

  getAssortmentConfig(articleId: string): AssortmentCreation | undefined {
    return this.selectedAssortments.find(a => a.articleId === articleId);
  }

  trackByArticleId(index: number, article: Article): string {
    return article.id;
  }
}