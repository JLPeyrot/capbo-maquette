import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface HierarchicalCategory {
  id: string;
  name: string;
  level: number;
  parentId?: string;
  children?: HierarchicalCategory[];
  expanded?: boolean;
  path?: string[];
  isSelectable?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private categories: HierarchicalCategory[] = [
    {
      id: '1',
      name: 'Électronique',
      level: 1,
      expanded: false,
      isSelectable: false,
      children: [
        {
          id: '1-1',
          name: 'Smartphones',
          level: 2,
          parentId: '1',
          expanded: false,
          isSelectable: false,
          children: [
            {
              id: '1-1-1',
              name: 'iPhone',
              level: 3,
              parentId: '1-1',
              expanded: false,
              isSelectable: false,
              children: [
                {
                  id: '1-1-1-1',
                  name: 'iPhone 15',
                  level: 4,
                  parentId: '1-1-1',
                  expanded: false,
                  isSelectable: false,
                  children: [
                    {
                      id: '1-1-1-1-1',
                      name: 'iPhone 15 Pro Max',
                      level: 5,
                      parentId: '1-1-1-1',
                      isSelectable: true
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
              isSelectable: false,
              children: [
                {
                  id: '1-1-2-1',
                  name: 'Galaxy S',
                  level: 4,
                  parentId: '1-1-2',
                  expanded: false,
                  isSelectable: false,
                  children: [
                    {
                      id: '1-1-2-1-1',
                      name: 'Galaxy S24 Ultra',
                      level: 5,
                      parentId: '1-1-2-1',
                      isSelectable: true
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
          isSelectable: false,
          children: [
            {
              id: '1-2-1',
              name: 'Portables',
              level: 3,
              parentId: '1-2',
              isSelectable: true
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
      isSelectable: false,
      children: [
        {
          id: '2-1',
          name: 'Homme',
          level: 2,
          parentId: '2',
          expanded: false,
          isSelectable: false,
          children: [
            {
              id: '2-1-1',
              name: 'Chemises',
              level: 3,
              parentId: '2-1',
              isSelectable: true
            },
            {
              id: '2-1-2',
              name: 'Pantalons',
              level: 3,
              parentId: '2-1',
              isSelectable: true
            },
            {
              id: '2-1-3',
              name: 'T-shirts',
              level: 3,
              parentId: '2-1',
              isSelectable: true
            }
          ]
        },
        {
          id: '2-2',
          name: 'Femme',
          level: 2,
          parentId: '2',
          expanded: false,
          isSelectable: false,
          children: [
            {
              id: '2-2-1',
              name: 'Robes',
              level: 3,
              parentId: '2-2',
              isSelectable: true
            },
            {
              id: '2-2-2',
              name: 'Jupes',
              level: 3,
              parentId: '2-2',
              isSelectable: true
            }
          ]
        }
      ]
    },
    {
      id: '3',
      name: 'Accessoires',
      level: 1,
      expanded: false,
      isSelectable: false,
      children: [
        {
          id: '3-1',
          name: 'Sacs',
          level: 2,
          parentId: '3',
          isSelectable: true
        },
        {
          id: '3-2',
          name: 'Bijoux',
          level: 2,
          parentId: '3',
          isSelectable: true
        },
        {
          id: '3-3',
          name: 'Ceintures',
          level: 2,
          parentId: '3',
          isSelectable: true
        }
      ]
    }
  ];

  /**
   * Get all categories
   */
  getCategories(): Observable<HierarchicalCategory[]> {
    return of(this.categories);
  }

  /**
   * Get categories by level
   */
  getCategoriesByLevel(level: number, parentId?: string): HierarchicalCategory[] {
    if (level === 1) {
      return this.categories;
    }

    const parent = this.findCategoryById(parentId!);
    return parent?.children || [];
  }

  /**
   * Find category by ID
   */
  findCategoryById(id: string): HierarchicalCategory | null {
    return this.findCategoryRecursive(this.categories, id);
  }

  private findCategoryRecursive(categories: HierarchicalCategory[], id: string): HierarchicalCategory | null {
    for (const category of categories) {
      if (category.id === id) {
        return category;
      }
      if (category.children) {
        const found = this.findCategoryRecursive(category.children, id);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  /**
   * Get category path (breadcrumb)
   */
  getCategoryPath(categoryId: string): string[] {
    const path: string[] = [];
    this.buildCategoryPath(this.categories, categoryId, path);
    return path;
  }

  private buildCategoryPath(categories: HierarchicalCategory[], targetId: string, path: string[], currentPath: string[] = []): boolean {
    for (const category of categories) {
      const newPath = [...currentPath, category.name];
      
      if (category.id === targetId) {
        path.push(...newPath);
        return true;
      }
      
      if (category.children && this.buildCategoryPath(category.children, targetId, path, newPath)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get only selectable categories (leaf nodes or marked as selectable)
   */
  getSelectableCategories(): HierarchicalCategory[] {
    const selectable: HierarchicalCategory[] = [];
    this.collectSelectableCategories(this.categories, selectable);
    return selectable;
  }

  private collectSelectableCategories(categories: HierarchicalCategory[], result: HierarchicalCategory[]): void {
    for (const category of categories) {
      if (category.isSelectable) {
        result.push(category);
      }
      if (category.children) {
        this.collectSelectableCategories(category.children, result);
      }
    }
  }

  /**
   * Check if category has children
   */
  hasChildren(categoryId: string): boolean {
    const category = this.findCategoryById(categoryId);
    return !!(category?.children && category.children.length > 0);
  }

  /**
   * Get category level structure for dropdowns
   */
  getCategoryLevels(selectedPath: { [level: number]: string }): { [level: number]: HierarchicalCategory[] } {
    const levels: { [level: number]: HierarchicalCategory[] } = {};
    
    // Level 1 - always available
    levels[1] = this.categories;
    
    // Build subsequent levels based on selections
    for (let level = 2; level <= 5; level++) {
      const parentId = selectedPath[level - 1];
      if (parentId) {
        const children = this.getCategoriesByLevel(level, parentId);
        if (children.length > 0) {
          levels[level] = children;
        }
      }
    }
    
    return levels;
  }

  /**
   * Validate if a category can be selected for an article
   */
  isCategorySelectable(categoryId: string): boolean {
    const category = this.findCategoryById(categoryId);
    return category?.isSelectable || false;
  }
}