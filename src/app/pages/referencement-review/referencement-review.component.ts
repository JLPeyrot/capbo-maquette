import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AssortimentDialogComponent, AssortimentDialogResult } from './assortiment-dialog.component';
import { AssortimentsService } from '../../services/assortiments.service';
import { forkJoin } from 'rxjs';
import { MaterialModule } from '../../shared/material-module';
import { ReferencementSelectionService, SelectedArticleSummary } from '../referencement/referencement-selection.service';

@Component({
  selector: 'app-referencement-review',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './referencement-review.component.html',
  styleUrls: ['./referencement-review.component.scss']
})
export class ReferencementReviewComponent implements OnInit {
  selection: SelectedArticleSummary[] = [];
  displayedColumns: string[] = ['select','reference','designation'];
  private selectedIds = new Set<string>();
  get selectionCount(): number { return this.selection?.length ?? 0; }
  get checkedCount(): number { return this.selectedIds.size; }

  constructor(
    private selectionService: ReferencementSelectionService,
    private router: Router,
    private dialog: MatDialog,
    private assortiments: AssortimentsService
  ) {}

  ngOnInit(): void {
    this.selection = this.selectionService.getSelection();
  }

  goBack(): void {
    this.router.navigateByUrl('/referencement');
  }

  validateReferencing(): void {
    // Point d’accroche pour la validation réelle (API, etc.)
    const ids = Array.from(this.selectedIds);
    console.log('[Référencement] Validation de', ids.length, 'article(s) cochés', ids);
    // Pour l’instant, retour vers la page principale après validation
    this.router.navigateByUrl('/referencement');
  }

  // Bouton "Passer cette étape" (navigation vers l'étape suivante du flux)
  skipStep(): void {
    // Si vous souhaitez une autre destination, dites-moi laquelle.
    // Hypothèse : aller vers la sélection de tronc pour la suite du process
    this.router.navigateByUrl('/trunk-selection');
  }

  createAssortimentCommandable(article: SelectedArticleSummary): void {
    const ref = this.dialog.open(AssortimentDialogComponent, {
      data: { article, mode: 'commandable' },
      width: '900px',
      maxWidth: '95vw',
      panelClass: 'assortiment-dialog-panel'
    });
    ref.afterClosed().subscribe((result?: AssortimentDialogResult) => {
      if (result) {
        const payload = {
          articleId: result.articleId,
          metatype: result.mode,
          type: result.type,
          dateDebut: result.startDate ? new Date(result.startDate).toISOString() : null,
          dateFin: result.endDate ? new Date(result.endDate).toISOString() : null,
          actif: true
        };
        this.assortiments.createAssortiment(payload).subscribe(created => {
          console.log('[Assortiment] Commandable enregistré', created);
        });
      }
    });
  }

  createAssortimentVendable(article: SelectedArticleSummary): void {
    const ref = this.dialog.open(AssortimentDialogComponent, {
      data: { article, mode: 'vendable' },
      width: '900px',
      maxWidth: '95vw',
      panelClass: 'assortiment-dialog-panel'
    });
    ref.afterClosed().subscribe((result?: AssortimentDialogResult) => {
      if (result) {
        const payload = {
          articleId: result.articleId,
          metatype: result.mode,
          type: result.type,
          dateDebut: result.startDate ? new Date(result.startDate).toISOString() : null,
          dateFin: result.endDate ? new Date(result.endDate).toISOString() : null,
          actif: true
        };
        this.assortiments.createAssortiment(payload).subscribe(created => {
          console.log('[Assortiment] Vendable enregistré', created);
        });
      }
    });
  }

  // Boutons globaux (en haut de page) ciblant les articles cochés
  private getFirstCheckedArticle(): SelectedArticleSummary | undefined {
    const firstId = Array.from(this.selectedIds.values())[0];
    return this.selection.find(a => a.id === firstId);
  }

  createAssortimentCommandableSelected(): void {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) return;
    const first = this.selection.find(a => a.id === ids[0]);
    if (!first) return;

    const ref = this.dialog.open(AssortimentDialogComponent, {
      data: { article: first, mode: 'commandable', selectedCount: ids.length },
      width: '900px',
      maxWidth: '95vw',
      panelClass: 'assortiment-dialog-panel'
    });

    ref.afterClosed().subscribe((result?: AssortimentDialogResult) => {
      if (!result) return;
      const requests = ids.map(articleId => this.assortiments.createAssortiment({
        articleId,
        metatype: result.mode,
        type: result.type,
        dateDebut: result.startDate ? new Date(result.startDate).toISOString() : null,
        dateFin: result.endDate ? new Date(result.endDate).toISOString() : null,
        actif: true
      }));

      forkJoin(requests).subscribe(createdList => {
        console.log(`[Assortiments] Commandable enregistrés: ${createdList.length}`, createdList);
      });
    });
  }

  createAssortimentVendableSelected(): void {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) return;
    const first = this.selection.find(a => a.id === ids[0]);
    if (!first) return;

    const ref = this.dialog.open(AssortimentDialogComponent, {
      data: { article: first, mode: 'vendable', selectedCount: ids.length },
      width: '900px',
      maxWidth: '95vw',
      panelClass: 'assortiment-dialog-panel'
    });

    ref.afterClosed().subscribe((result?: AssortimentDialogResult) => {
      if (!result) return;
      const requests = ids.map(articleId => this.assortiments.createAssortiment({
        articleId,
        metatype: result.mode,
        type: result.type,
        dateDebut: result.startDate ? new Date(result.startDate).toISOString() : null,
        dateFin: result.endDate ? new Date(result.endDate).toISOString() : null,
        actif: true
      }));

      forkJoin(requests).subscribe(createdList => {
        console.log(`[Assortiments] Vendable enregistrés: ${createdList.length}`, createdList);
      });
    });
  }

  // Sélection via cases à cocher
  isSelected(article: SelectedArticleSummary): boolean {
    return this.selectedIds.has(article.id);
  }

  toggleArticle(article: SelectedArticleSummary, checked: boolean): void {
    if (checked) {
      this.selectedIds.add(article.id);
    } else {
      this.selectedIds.delete(article.id);
    }
  }

  isAllSelected(): boolean {
    return this.selection.length > 0 && this.selectedIds.size === this.selection.length;
  }

  toggleAll(checked: boolean): void {
    if (checked) {
      this.selectedIds = new Set(this.selection.map(a => a.id));
    } else {
      this.selectedIds.clear();
    }
  }
}
