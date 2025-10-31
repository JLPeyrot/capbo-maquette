import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map } from 'rxjs';

export interface SiteGroup {
  code_groupe: string;
  libelle_groupe: string;
  valeurs: string[];
}

export interface SiteGroupsData {
  groupes: SiteGroup[];
}

export interface GroupOption {
  id: string;
  name: string;
  category: string;
  values: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SiteGroupsService {
  private siteGroupsSubject = new BehaviorSubject<SiteGroupsData | null>(null);
  public siteGroups$ = this.siteGroupsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadSiteGroups();
  }

  /**
   * Charge les groupes de sites depuis le fichier JSON
   */
  private loadSiteGroups(): void {
    this.http.get<SiteGroupsData>('/data/groupes-sites.json').subscribe({
      next: (data) => {
        this.siteGroupsSubject.next(data);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des groupes de sites:', error);
        this.siteGroupsSubject.next(null);
      }
    });
  }

  /**
   * Obtient tous les groupes de sites
   */
  getSiteGroups(): Observable<SiteGroup[]> {
    return this.siteGroups$.pipe(
      map(data => data?.groupes || [])
    );
  }

  /**
   * Obtient un groupe de sites par son code
   */
  getSiteGroupByCode(code: string): Observable<SiteGroup | undefined> {
    return this.siteGroups$.pipe(
      map(data => data?.groupes.find(group => group.code_groupe === code))
    );
  }

  /**
   * Convertit les groupes de sites en format compatible avec les composants existants
   */
  getGroupOptions(): Observable<GroupOption[]> {
    return this.siteGroups$.pipe(
      map(data => {
        if (!data?.groupes) return [];
        
        const options: GroupOption[] = [];
        
        data.groupes.forEach(group => {
          group.valeurs.forEach(value => {
            options.push({
              id: `${group.code_groupe}_${value}`,
              name: value,
              category: group.libelle_groupe,
              values: [value]
            });
          });
        });
        
        return options;
      })
    );
  }

  /**
   * Obtient les groupes organisés par catégorie
   */
  getGroupsByCategory(): Observable<{ [category: string]: GroupOption[] }> {
    return this.getGroupOptions().pipe(
      map(options => {
        const grouped: { [category: string]: GroupOption[] } = {};
        
        options.forEach(option => {
          if (!grouped[option.category]) {
            grouped[option.category] = [];
          }
          grouped[option.category].push(option);
        });
        
        return grouped;
      })
    );
  }

  /**
   * Recherche des groupes par terme
   */
  searchGroups(searchTerm: string): Observable<GroupOption[]> {
    return this.getGroupOptions().pipe(
      map(options => {
        if (!searchTerm.trim()) return options;
        
        const term = searchTerm.toLowerCase();
        return options.filter(option => 
          option.name.toLowerCase().includes(term) ||
          option.category.toLowerCase().includes(term)
        );
      })
    );
  }

  /**
   * Rafraîchit les données des groupes de sites
   */
  refreshSiteGroups(): void {
    this.loadSiteGroups();
  }
}