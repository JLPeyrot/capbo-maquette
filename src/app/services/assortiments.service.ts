import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export type MetaType = 'vendable' | 'commandable';
export type AssortType = 'permanent' | 'catalogue' | 'promotion';

export interface Assortiment {
  id: string;
  articleId: string;
  metatype: MetaType;
  type: AssortType;
  dateDebut: string | null;
  dateFin: string | null;
  actif: boolean;
}

export interface AssortimentsData {
  assortiments: Assortiment[];
}

@Injectable({ providedIn: 'root' })
export class AssortimentsService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<AssortimentsData> {
    return this.http.get<AssortimentsData>('/api/assortiments')
      .pipe(
        catchError(err => {
          console.error('Erreur chargement assortiments:', err);
          return of({ assortiments: [] });
        })
      );
  }

  createAssortiment(payload: Omit<Assortiment, 'id'> & { id?: string }): Observable<Assortiment> {
    return this.http.post<Assortiment>('/api/assortiments', payload)
      .pipe(
        catchError(err => {
          console.error('Erreur création assortiment:', err);
          // Renvoi d’un objet vide pour éviter de casser l’UI en cas d’échec
          return of({ id: '', articleId: payload.articleId, metatype: payload.metatype, type: payload.type, dateDebut: payload.dateDebut ?? null, dateFin: payload.dateFin ?? null, actif: !!payload.actif });
        })
      );
  }

  updateAssortiment(id: string, updates: Partial<Omit<Assortiment, 'id'>>): Observable<Assortiment> {
    return this.http.put<Assortiment>(`/api/assortiments/${id}`, updates)
      .pipe(
        catchError(err => {
          console.error('Erreur mise à jour assortiment:', err);
          return of({ id, articleId: updates.articleId || '', metatype: (updates.metatype as MetaType) || 'vendable', type: (updates.type as AssortType) || 'permanent', dateDebut: updates.dateDebut ?? null, dateFin: updates.dateFin ?? null, actif: !!updates.actif });
        })
      );
  }

  deleteAssortiment(id: string): Observable<{ deleted: string }> {
    return this.http.delete<{ deleted: string }>(`/api/assortiments/${id}`)
      .pipe(
        catchError(err => {
          console.error('Erreur suppression assortiment:', err);
          return of({ deleted: id });
        })
      );
  }
}
