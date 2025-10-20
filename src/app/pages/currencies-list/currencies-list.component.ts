import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MaterialModule } from '../../shared/material-module';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';

export interface Currency {
  id: string;
  code: string;
  numericCode: string;
  name: string;
  symbol: string;
  rounding: number;
  is_active: boolean;
}

export interface CurrencyFilters {
  search: string;
  is_active: boolean;
}

@Component({
  selector: 'app-currencies-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, MatCheckboxModule],
  templateUrl: './currencies-list.component.html',
  styleUrls: ['./currencies-list.component.scss']
})
export class CurrenciesListComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() isFocusMode: boolean = false;
  @Output() goBack = new EventEmitter<void>();
  @Output() createCurrency = new EventEmitter<void>();
  @Output() editCurrencyEvent = new EventEmitter<string>();
  
  @ViewChild(MatSort) sort!: MatSort;
  
  private destroy$ = new Subject<void>();

  constructor(private paginatorIntl: MatPaginatorIntl) {
    // Configuration des labels français pour le paginator
    this.paginatorIntl.itemsPerPageLabel = 'Éléments par page :';
    this.paginatorIntl.nextPageLabel = 'Page suivante';
    this.paginatorIntl.previousPageLabel = 'Page précédente';
    this.paginatorIntl.firstPageLabel = 'Première page';
    this.paginatorIntl.lastPageLabel = 'Dernière page';
    this.paginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
      if (length === 0 || pageSize === 0) {
        return `0 sur ${length}`;
      }
      const startIndex = page * pageSize;
      const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
      return `${startIndex + 1} - ${endIndex} sur ${length}`;
    };
  }

  // Données des devises
  currencies: Currency[] = [
    {
      id: '1',
      code: 'EUR',
      numericCode: '978',
      name: 'Euro',
      symbol: '€',
      rounding: 0.01,
      is_active: true
    },
    {
      id: '2',
      code: 'USD',
      numericCode: '840',
      name: 'US Dollar',
      symbol: '$',
      rounding: 0.01,
      is_active: true
    },
    {
      id: '3',
      code: 'GBP',
      numericCode: '826',
      name: 'British Pound',
      symbol: '£',
      rounding: 0.01,
      is_active: true
    },
    {
      id: '4',
      code: 'JPY',
      numericCode: '392',
      name: 'Japanese Yen',
      symbol: '¥',
      rounding: 1,
      is_active: false
    }
  ];

  dataSource = new MatTableDataSource<Currency>(this.currencies);
  
  // Configuration du tableau
  displayedColumns: string[] = ['select', 'code', 'numericCode', 'name', 'symbol', 'rounding', 'status', 'actions'];
  selection = new SelectionModel<Currency>(true, []);
  
  // Pagination
  pageSize = 10;
  
  // Filtres
  filters: CurrencyFilters = {
    search: '',
    is_active: false
  };

  ngOnInit(): void {
    this.applyFilters();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Gestion des filtres
  onFilterChange(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.filters = {
      search: '',
      is_active: false
    };
    this.applyFilters();
  }

  private applyFilters(): void {
    let filteredData = this.currencies.filter(currency => {
      // Filtre de recherche
      const searchMatch = !this.filters.search || 
        currency.code.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        currency.name.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        currency.symbol.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        currency.numericCode.includes(this.filters.search);

      // Filtre de statut - si la checkbox est cochée, ne montrer que les devises actives
      const statusMatch = !this.filters.is_active || currency.is_active === true;

      return searchMatch && statusMatch;
    });

    this.dataSource.data = filteredData;

    // Réinitialiser la sélection après filtrage
    this.selection.clear();
  }

  // Gestion de la sélection
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }

  checkboxLabel(row?: Currency): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.id}`;
  }

  // Actions
  onGoBack(): void {
    this.goBack.emit();
  }

  onCreateCurrency(): void {
    this.createCurrency.emit();
  }

  onRowClick(currency: Currency): void {
    // Navigation vers les détails ou édition
    this.editCurrency(currency.id);
  }

  editCurrency(currencyId: string): void {
    this.editCurrencyEvent.emit(currencyId);
  }

  viewDetails(currency: Currency): void {
    // Navigation vers les détails
    console.log('View details for currency:', currency);
  }

  toggleActive(currency: Currency): void {
    currency.is_active = !currency.is_active;
    this.applyFilters();
  }

  deleteCurrency(currencyId: string): void {
    const currency = this.currencies.find(c => c.id === currencyId);
    if (currency && confirm(`Êtes-vous sûr de vouloir supprimer la devise "${currency.name}" ?`)) {
      this.currencies = this.currencies.filter(c => c.id !== currencyId);
      this.applyFilters();
    }
  }

  bulkDelete(): void {
    const selectedIds = this.selection.selected.map(currency => currency.id);
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.length} devise(s) ?`)) {
      this.currencies = this.currencies.filter(currency => !selectedIds.includes(currency.id));
      this.selection.clear();
      this.applyFilters();
    }
  }
}