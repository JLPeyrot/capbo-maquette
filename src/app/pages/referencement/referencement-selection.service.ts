import { Injectable } from '@angular/core';

export interface SelectedArticleSummary {
  id: string;
  reference: string;
  designation: string;
  fournisseur: string;
  marque: string;
  famille: string;
  prixAchat?: number;
}

@Injectable({ providedIn: 'root' })
export class ReferencementSelectionService {
  private selection: SelectedArticleSummary[] = [];

  setSelection(summaries: SelectedArticleSummary[]): void {
    this.selection = Array.isArray(summaries) ? summaries : [];
  }

  getSelection(): SelectedArticleSummary[] {
    return this.selection;
  }

  clear(): void {
    this.selection = [];
  }
}

