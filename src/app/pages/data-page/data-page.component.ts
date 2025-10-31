import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { DataService, ProductData } from '../../shared/services/data.service';

@Component({
  selector: 'app-data-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, MatButtonToggleModule],
  templateUrl: './data-page.component.html',
  styleUrls: ['./data-page.component.scss']
})
export class DataPageComponent implements OnInit {
  
  // Données
  allData: ProductData[] = [];
  filteredData: ProductData[] = [];
  
  // Filtres
  selectedUnivers: string = '';
  selectedFamille: string = '';
  searchTerm: string = '';
  
  // Options pour les filtres
  universOptions: string[] = [];
  familleOptions: string[] = [];
  
  // Statistiques
  stats = {
    totalItems: 0,
    universCount: 0,
    familleCount: 0,
    sousFamilleCount: 0
  };
  
  // Vue
  viewMode: 'table' | 'cards' | 'tree' = 'table';
  
  // Pagination
  pageSize = 10;
  currentPage = 0;
  paginatedData: ProductData[] = [];
  
  constructor(private dataService: DataService) {}
  
  ngOnInit(): void {
    this.loadData();
    this.loadStats();
  }
  
  loadData(): void {
    this.allData = this.dataService.getAllData();
    this.filteredData = [...this.allData];
    this.universOptions = this.dataService.getUnivers();
    this.updatePagination();
  }
  
  loadStats(): void {
    this.stats = this.dataService.getStats();
  }
  
  onUniversChange(): void {
    if (this.selectedUnivers) {
      this.familleOptions = this.dataService.getFamillesByUnivers(this.selectedUnivers);
    } else {
      this.familleOptions = [];
    }
    this.selectedFamille = '';
    this.applyFilters();
  }
  
  onFamilleChange(): void {
    this.applyFilters();
  }
  
  onSearchChange(): void {
    this.applyFilters();
  }
  
  applyFilters(): void {
    this.filteredData = this.dataService.filterData({
      univers: this.selectedUnivers || undefined,
      famille: this.selectedFamille || undefined,
      search: this.searchTerm || undefined
    });
    this.currentPage = 0;
    this.updatePagination();
  }
  
  clearFilters(): void {
    this.selectedUnivers = '';
    this.selectedFamille = '';
    this.searchTerm = '';
    this.familleOptions = [];
    this.filteredData = [...this.allData];
    this.currentPage = 0;
    this.updatePagination();
  }
  
  changeViewMode(mode: 'table' | 'cards' | 'tree'): void {
    this.viewMode = mode;
  }
  
  // Pagination
  updatePagination(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedData = this.filteredData.slice(startIndex, endIndex);
  }
  
  nextPage(): void {
    if ((this.currentPage + 1) * this.pageSize < this.filteredData.length) {
      this.currentPage++;
      this.updatePagination();
    }
  }
  
  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updatePagination();
    }
  }
  
  goToPage(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }
  
  get totalPages(): number {
    return Math.ceil(this.filteredData.length / this.pageSize);
  }
  
  get pageNumbers(): number[] {
    const pages = [];
    for (let i = 0; i < this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
  
  // Vue arbre
  getTreeData(): any {
    const tree: any = {};
    
    this.filteredData.forEach(item => {
      if (!tree[item.univers]) {
        tree[item.univers] = {};
      }
      if (!tree[item.univers][item.famille]) {
        tree[item.univers][item.famille] = [];
      }
      if (!tree[item.univers][item.famille].includes(item.sousFamille)) {
        tree[item.univers][item.famille].push(item.sousFamille);
      }
    });
    
    return tree;
  }
  
  getTreeKeys(): string[] {
    return Object.keys(this.getTreeData());
  }
  
  getFamilleKeys(univers: string): string[] {
    const tree = this.getTreeData();
    return Object.keys(tree[univers] || {});
  }
  
  getSousFamilles(univers: string, famille: string): string[] {
    const tree = this.getTreeData();
    return tree[univers]?.[famille] || [];
  }
}