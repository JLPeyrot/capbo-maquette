import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material-module';
import { FormsModule } from '@angular/forms';

interface MultilingualName {
  fr: string;
  en: string;
  es: string;
  de: string;
}

interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface Category {
  id: string;
  name: string;
  nameEn?: string;
  nameEs?: string;
  nameDe?: string;
  level: number;
  parentId?: string;
  expanded?: boolean;
  children?: Category[];
  path?: string[];
}

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule],
  templateUrl: './categories-list.component.html',
  styleUrls: ['./categories-list.component.scss']
})
export class CategoriesListComponent implements OnInit {
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  // Propriétés de recherche et filtrage
  searchQuery: string = '';
  levelFilter: string = '';
  parentFilter: string = '';
  selectedCategory: Category | null = null;
  isCreating: boolean = false;
  isEditing: boolean = false;
  
  // Propriétés pour la gestion multilingue
  languages: Language[] = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
  ];
  selectedLanguage: string = 'fr';
  translationsEnabled: boolean = false;
  
  newCategory: Partial<Category> = {
    name: '',
    nameEn: '',
    nameEs: '',
    nameDe: '',
    level: 1,
    parentId: undefined
  };

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    // Données de démonstration avec hiérarchie à 5 niveaux
    this.categories = [
      {
        id: '1',
        name: 'Électronique',
        level: 1,
        expanded: false,
        children: [
          {
            id: '1-1',
            name: 'Smartphones',
            level: 2,
            parentId: '1',
            expanded: false,
            children: [
              {
                id: '1-1-1',
                name: 'iPhone',
                level: 3,
                parentId: '1-1',
                expanded: false,
                children: [
                  {
                    id: '1-1-1-1',
                    name: 'iPhone 15',
                    level: 4,
                    parentId: '1-1-1',
                    expanded: false,
                    children: [
                      {
                        id: '1-1-1-1-1',
                        name: 'iPhone 15 Pro Max',
                        level: 5,
                        parentId: '1-1-1-1'
                      }
                    ]
                  }
                ]
              },
              {
                id: '1-1-2',
                name: 'Samsung',
                level: 3,
                parentId: '1-1',
                expanded: false,
                children: [
                  {
                    id: '1-1-2-1',
                    name: 'Galaxy S',
                    level: 4,
                    parentId: '1-1-2',
                    expanded: false,
                    children: [
                      {
                        id: '1-1-2-1-1',
                        name: 'Galaxy S24 Ultra',
                        level: 5,
                        parentId: '1-1-2-1'
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            id: '1-2',
            name: 'Ordinateurs',
            level: 2,
            parentId: '1',
            expanded: false,
            children: [
              {
                id: '1-2-1',
                name: 'Portables',
                level: 3,
                parentId: '1-2'
              }
            ]
          }
        ]
      },
      {
        id: '2',
        name: 'Vêtements',
        level: 1,
        expanded: false,
        children: [
          {
            id: '2-1',
            name: 'Homme',
            level: 2,
            parentId: '2',
            expanded: false,
            children: [
              {
                id: '2-1-1',
                name: 'Chemises',
                level: 3,
                parentId: '2-1'
              }
            ]
          }
        ]
      }
    ];
    
    this.filteredCategories = [...this.categories];
  }

  toggleCategory(category: Category) {
    category.expanded = !category.expanded;
  }

  selectCategory(category: Category) {
    this.selectedCategory = category;
  }

  // Créer une nouvelle catégorie
  createCategory(): void {
    this.isCreating = true;
    this.selectedCategory = null;
    this.newCategory = {
      name: '',
      level: 1,
      parentId: undefined
    };
  }

  // Alias pour compatibilité
  startCreating(parentCategory?: Category) {
    this.isCreating = true;
    this.newCategory = {
      name: '',
      level: parentCategory ? parentCategory.level + 1 : 1,
      parentId: parentCategory?.id
    };
  }

  startEditing(category: Category) {
    this.isEditing = true;
    this.selectedCategory = category;
    this.newCategory = { ...category };
  }

  saveCategory() {
    if (this.newCategory.name?.trim()) {
      if (this.isEditing && this.selectedCategory) {
        // Mise à jour
        this.selectedCategory.name = this.newCategory.name;
        this.selectedCategory.nameEn = this.newCategory.nameEn;
        this.selectedCategory.nameEs = this.newCategory.nameEs;
        this.selectedCategory.nameDe = this.newCategory.nameDe;
      } else {
        // Création
        const newCat: Category = {
          id: Date.now().toString(),
          name: this.newCategory.name,
          nameEn: this.newCategory.nameEn,
          nameEs: this.newCategory.nameEs,
          nameDe: this.newCategory.nameDe,
          level: this.newCategory.level || 1,
          parentId: this.newCategory.parentId,
          expanded: false
        };
        
        if (this.newCategory.parentId) {
          // Ajouter à la catégorie parent
          this.addToParent(this.categories, newCat);
        } else {
          // Ajouter au niveau racine
          this.categories.push(newCat);
        }
      }
      
      this.cancelEdit();
      this.filteredCategories = [...this.categories];
    }
  }

  private addToParent(categories: Category[], newCategory: Category) {
    for (const cat of categories) {
      if (cat.id === newCategory.parentId) {
        if (!cat.children) cat.children = [];
        cat.children.push(newCategory);
        return;
      }
      if (cat.children) {
        this.addToParent(cat.children, newCategory);
      }
    }
  }

  deleteCategory(category: Category) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" et toutes ses sous-catégories ?`)) {
      this.removeFromCategories(this.categories, category.id);
      this.filteredCategories = [...this.categories];
      if (this.selectedCategory?.id === category.id) {
        this.selectedCategory = null;
      }
    }
  }

  private removeFromCategories(categories: Category[], categoryId: string): boolean {
    for (let i = 0; i < categories.length; i++) {
      if (categories[i].id === categoryId) {
        categories.splice(i, 1);
        return true;
      }
      if (categories[i].children && this.removeFromCategories(categories[i].children!, categoryId)) {
        return true;
      }
    }
    return false;
  }

  cancelEdit() {
    this.isCreating = false;
    this.isEditing = false;
    this.selectedCategory = null;
    this.translationsEnabled = false;
    this.selectedLanguage = 'fr';
    this.newCategory = {
      name: '',
      nameEn: '',
      nameEs: '',
      nameDe: '',
      level: 1,
      parentId: undefined
    };
  }
  
  // Méthode pour obtenir le nom d'affichage d'une catégorie
  getCategoryDisplayName(category: Category): string {
    return category.name || 'Sans nom';
  }
  
  // Méthode pour changer la langue sélectionnée
  onLanguageChange(languageCode: string) {
    this.selectedLanguage = languageCode;
  }
  
  // Méthode pour obtenir le nom d'une langue à partir de son code
  getLanguageName(languageCode: string): string {
    const language = this.languages.find(l => l.code === languageCode);
    return language ? language.name : 'Français';
  }
  
  // Méthode pour obtenir le nom d'une catégorie par langue
  getCategoryNameByLanguage(languageCode: string): string {
    if (languageCode === 'fr') return this.newCategory.name || '';
    if (languageCode === 'en') return this.newCategory.nameEn || '';
    if (languageCode === 'es') return this.newCategory.nameEs || '';
    if (languageCode === 'de') return this.newCategory.nameDe || '';
    return '';
  }
  
  // Méthode pour mettre à jour le nom d'une catégorie par langue
  updateCategoryName(languageCode: string, value: string): void {
    if (languageCode === 'fr') this.newCategory.name = value;
    else if (languageCode === 'en') this.newCategory.nameEn = value;
    else if (languageCode === 'es') this.newCategory.nameEs = value;
    else if (languageCode === 'de') this.newCategory.nameDe = value;
  }

  // Méthode de filtrage unifiée
  filterCategories(): void {
    this.filteredCategories = this.categories.filter(category => {
      const nameMatch = this.searchQuery ? this.getCategoryDisplayName(category).toLowerCase().includes(this.searchQuery.toLowerCase()) : true;
      const levelMatch = this.levelFilter ? category.level === parseInt(this.levelFilter) : true;
      const parentMatch = this.parentFilter ? category.parentId === this.parentFilter : true;
      return nameMatch && levelMatch && parentMatch;
    });
  }

  // Réinitialiser les filtres
  resetFilters(): void {
    this.searchQuery = '';
    this.levelFilter = '';
    this.parentFilter = '';
    this.filterCategories();
  }

  // Obtenir les catégories parentes pour le filtre
  getParentCategories(): Category[] {
    return this.flattenCategories(this.categories).filter(category => category.level < 5);
  }

  // Obtenir le nombre de catégories filtrées
  getFilteredCategoriesCount(): number {
    return this.flattenCategories(this.filteredCategories).length;
  }

  // Aplatir la hiérarchie des catégories
  private flattenCategories(categories: Category[]): Category[] {
    const flattened: Category[] = [];
    
    const flatten = (cats: Category[]) => {
      for (const cat of cats) {
        flattened.push(cat);
        if (cat.children) {
          flatten(cat.children);
        }
      }
    };
    
    flatten(categories);
    return flattened;
  }

  searchCategories() {
    this.filterCategories();
  }

  private filterCategoriesRecursive(categories: Category[], query: string): Category[] {
    const filtered: Category[] = [];
    
    for (const category of categories) {
      const matchesName = this.getCategoryDisplayName(category).toLowerCase().includes(query);
      const filteredChildren = category.children ? this.filterCategoriesRecursive(category.children, query) : [];
      
      if (matchesName || filteredChildren.length > 0) {
        const filteredCategory: Category = {
          ...category,
          children: filteredChildren.length > 0 ? filteredChildren : category.children,
          expanded: filteredChildren.length > 0 ? true : category.expanded
        };
        filtered.push(filteredCategory);
      }
    }
    
    return filtered;
  }

  getCategoryPath(category: Category): string {
    const path: string[] = [];
    this.buildPath(this.categories, category.id, path);
    return path.reverse().join(' > ');
  }

  private buildPath(categories: Category[], targetId: string, path: string[], currentPath: string[] = []): boolean {
    for (const category of categories) {
      const newPath = [...currentPath, this.getCategoryDisplayName(category)];
      
      if (category.id === targetId) {
        path.push(...newPath);
        return true;
      }
      
      if (category.children && this.buildPath(category.children, targetId, path, newPath)) {
        return true;
      }
    }
    return false;
  }

  getLevelIndent(level: number): string {
    return `${(level - 1) * 24}px`;
  }

  canAddChild(category: Category): boolean {
    return category.level < 5;
  }
}