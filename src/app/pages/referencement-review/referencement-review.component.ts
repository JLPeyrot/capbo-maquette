import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AssortimentDialogComponent, AssortimentDialogResult } from './assortiment-dialog.component';
import { AssortimentsService } from '../../services/assortiments.service';
import { MaterialModule } from '../../shared/material-module';
import { ReferencementSelectionService, SelectedArticleSummary } from '../referencement/referencement-selection.service';
import { HttpClient } from '@angular/common/http';

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

  // Données pour la structure marchandise (familles > sous-familles)
  showMerchTree: boolean = false;
  merchTree: Record<string, string[]> = {};
  familiesByUnivers: Record<string, string[]> = {};
  merchTreeUnivers: string[] = [];
  selectedMerchNode?: { univers: string; famille?: string; sousFamille?: string };
  expandedUnivers = new Set<string>();
  expandedFamilies = new Set<string>();
  // Sélection de l’enseigne affectée
  selectedEnseignes: string[] = [];
  enseigneOptions = [
    { value: 'boulanger', label: 'Boulanger' },
    { value: 'electrodepot', label: 'Electrodépot' }
  ];

  constructor(
    private selectionService: ReferencementSelectionService,
    private router: Router,
    private dialog: MatDialog,
    private assortiments: AssortimentsService,
    private http: HttpClient
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

  // Bloc de droite: ajout à la structure marchandise
  onAddToMerchStructureClick(): void {
    this.showMerchTree = true;
    this.buildMerchTree();
  }

  private buildMerchTree(): void {
    this.http.get<{ familles: { univers: string; familles: { code: string; libelle: string; sousFamilles: string[] }[] }[] }>(`/data/familles.json`)
      .subscribe(json => {
        const universBlocks = Array.isArray(json?.familles) ? json.familles : [];
        const universNames: string[] = [];
        const familiesByUnivers: Record<string, string[]> = {};
        const sousByFamily: Record<string, string[]> = {};

        for (const block of universBlocks) {
          const universName = String(block.univers);
          universNames.push(universName);
          const fams = Array.isArray(block.familles) ? block.familles : [];
          const famNames: string[] = [];
          for (const f of fams) {
            const famName = String(f.libelle);
            famNames.push(famName);
            const sous = Array.isArray(f.sousFamilles) ? f.sousFamilles.slice() : [];
            sousByFamily[famName] = sous;
          }
          familiesByUnivers[universName] = famNames.sort((a, b) => a.localeCompare(b));
        }

        const uniqUnivers = Array.from(new Set(universNames)).sort((a, b) => a.localeCompare(b));
        this.merchTreeUnivers = uniqUnivers;
        this.familiesByUnivers = familiesByUnivers;
        this.merchTree = sousByFamily;
      });
  }

  onSelectMerchNode(univers: string, famille?: string, sousFamille?: string): void {
    this.selectedMerchNode = { univers, famille, sousFamille };
  }

  isFamilyExpanded(famille: string): boolean {
    return this.expandedFamilies.has(famille);
  }

  isUniversExpanded(univers: string): boolean {
    return this.expandedUnivers.has(univers);
  }

  toggleFamily(famille: string, event?: MouseEvent): void {
    if (event) { event.stopPropagation(); }
    if (this.expandedFamilies.has(famille)) {
      this.expandedFamilies.delete(famille);
    } else {
      this.expandedFamilies.add(famille);
    }
  }

  toggleUnivers(univers: string, event?: MouseEvent): void {
    if (event) { event.stopPropagation(); }
    if (this.expandedUnivers.has(univers)) {
      this.expandedUnivers.delete(univers);
    } else {
      this.expandedUnivers.add(univers);
    }
  }

  onReferenceArticleClick(): void {
    if (!this.selectedMerchNode?.sousFamille) {
      this.dialog.open(this.errorAssignDialog, { width: '420px' });
      return;
    }
    this.dialog.open(this.confirmAssignDialog, { width: '420px' });
  }

  @ViewChild('confirmAssignDialog') confirmAssignDialog!: TemplateRef<any>;
  @ViewChild('errorAssignDialog') errorAssignDialog!: TemplateRef<any>;

  confirmAssign(): void {
    this.dialog.closeAll();
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
