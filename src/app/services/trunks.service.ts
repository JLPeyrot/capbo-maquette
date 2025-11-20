import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, forkJoin } from 'rxjs';

export interface TrunkItem {
  id: string;
  type: 'TAC' | 'TAN' | 'complementaire';
  name: string;
  status: 'actif' | 'brouillon' | 'archive';
  storesCount: number;
  createdDate: string; // ISO string in JSON
  lastModified: string; // ISO string in JSON
  groups: string[];
  attributes: string[];
  enseigne?: string;
}

export interface TrunksData {
  assortiments: TrunkItem[];
}

export interface MagasinItem {
  code_magasin: string;
  nom_magasin: string;
  taille: number;
  ville: string;
  groupes: string[];
  attributs: string[];
}

export interface MagasinsData {
  magasins: MagasinItem[];
}

export interface TrunkOption {
  id: string;
  name: string;
  type: 'TAC' | 'TAN' | 'complementaire';
}

@Injectable({ providedIn: 'root' })
export class TrunksService {
  private trunksSubject = new BehaviorSubject<TrunkItem[]>([]);
  public trunks$ = this.trunksSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadTrunks();
  }

  /** Charge les troncs depuis /public/data/troncs.json */
  private loadTrunks(): void {
    const troncs$ = this.http.get<TrunksData>('/data/troncs.json')
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des troncs:', error);
          return of({ assortiments: [] });
        })
      );

    const magasins$ = this.http.get<MagasinsData>('/data/magasins.json')
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des magasins:', error);
          return of({ magasins: [] });
        })
      );

    forkJoin({ troncs: troncs$, magasins: magasins$ }).subscribe(({ troncs, magasins }) => {
      const stores = magasins?.magasins || [];
      const assortiments = troncs?.assortiments || [];

      const brandOf = (m: MagasinItem): string => {
        const nm = String(m.nom_magasin || '').toLowerCase();
        if (nm.startsWith('electrodepot')) return 'electrodepot';
        if (nm.startsWith('boulanger')) return 'boulanger';
        return '';
      };

      const computeStoresCount = (groups: string[] = [], enseigne?: string): number => {
        const targetBrand = (enseigne || '').toLowerCase();
        const base = targetBrand ? stores.filter(m => brandOf(m) === targetBrand) : stores;
        if (!groups || groups.length === 0) return base.length;
        return base.filter(m => groups.every(g => Array.isArray(m.groupes) && m.groupes.includes(g))).length;
      };

      const withComputedCounts = assortiments.map(t => ({
        ...t,
        storesCount: computeStoresCount(t.groups || [], t.enseigne)
      }));

      this.trunksSubject.next(withComputedCounts);
    });
  }

  /** Rafraîchit les données des troncs */
  refreshTrunks(): void {
    this.loadTrunks();
  }

  /** Retourne tous les troncs avec conversion des dates en objets Date */
  getTrunks(): Observable<(
    Omit<TrunkItem, 'createdDate' | 'lastModified'> & { createdDate: Date; lastModified: Date }
  )[]> {
    return this.trunks$.pipe(
      map(items => items.map(item => ({
        ...item,
        createdDate: new Date(item.createdDate),
        lastModified: new Date(item.lastModified)
      })))
    );
  }

  /** Retourne des options simplifiées pour les listes/déroulants */
  getTrunkOptions(): Observable<TrunkOption[]> {
    return this.trunks$.pipe(
      map(items => items.map(item => ({ id: item.id, name: item.name, type: item.type })))
    );
  }
}
