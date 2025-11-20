import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TrunksService } from '../../services/trunks.service';
import { ArticlesService, Article } from '../../services/articles.service';
import { combineLatest } from 'rxjs';

interface Trunk {
  id: string;
  name: string;
  type: 'TAC' | 'TAN' | 'complementaire';
  status: 'actif' | 'brouillon' | 'archive';
  articlesCount: number;
  storesCount: number;
  createdDate: Date;
  lastModified: Date;
  groups: string[];
  attributes: string[];
  enseigne?: string;
}

@Component({
  selector: 'app-trunk-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MaterialModule],
  templateUrl: './trunk-management.component.html',
  styleUrls: ['./trunk-management.component.scss']
})
export class TrunkManagementComponent implements OnInit {
  
  searchForm: FormGroup;
  
  // Données des troncs (chargées depuis troncs.json)
  trunks: Trunk[] = [];

  filteredTrunks: Trunk[] = [];

  // Métadonnées hiérarchiques par tronc
  trunkMetaById: Record<string, { levels: number[]; univers: string[]; familles: string[]; sousFamilles: string[] }> = {};
  
  // Options de filtres
  trunkTypes = [
    { value: '', label: 'Tous les types' },
    { value: 'TAN', label: 'National' },
    { value: 'complementaire', label: 'Complémentaire' }
  ];
  enseignes = [
    { value: 'boulanger', label: 'Boulanger' },
    { value: 'electrodepot', label: 'Electrodépot' }
  ];

  selectedEnseigne: string = '';
  private dialogRef?: MatDialogRef<any>;
  @ViewChild('enseigneDialog') enseigneDialog!: TemplateRef<any>;

  // Statistiques
  stats = {
    totalTrunks: 0,
    activeTrunks: 0,
    draftTrunks: 0,
    totalArticles: 0
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private trunksService: TrunksService,
    private articlesService: ArticlesService,
    private dialog: MatDialog
  ) {
    this.searchForm = this.fb.group({
      searchTerm: [''],
      enseigne: [''],
      trunkType: ['']
    });
  }

  ngOnInit(): void {
    // Charger les troncs et les articles pour calculer le nombre réel d'articles rattachés
    combineLatest([
      this.trunksService.getTrunks(),
      this.articlesService.getArticles()
    ]).subscribe(([trunks, articles]) => {
      const countsByTrunk = this.computeArticlesCountByTrunk(articles);
      const updatedTrunks = trunks.map(t => {
        const withCount = { ...t, articlesCount: countsByTrunk.get(t.id) || 0 };
        return { ...withCount, status: this.getDerivedStatus(withCount) } as Trunk;
      });
      this.trunks = updatedTrunks as any;
      this.filteredTrunks = [...this.trunks];
      // Calculer les métadonnées hiérarchiques (niveaux, univers, familles, sous-familles)
      this.trunkMetaById = this.computeHierarchyMetaByTrunk(articles);
      this.calculateStats();
    });

    // Écouter les changements du formulaire de recherche
    this.searchForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  private computeArticlesCountByTrunk(articles: Article[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const a of articles) {
      if (!a.trunkId) continue;
      counts.set(a.trunkId, (counts.get(a.trunkId) || 0) + 1);
    }
    return counts;
  }

  calculateStats(): void {
    this.stats.totalTrunks = this.trunks.length;
    this.stats.activeTrunks = this.trunks.filter(t => t.status === 'actif').length;
    this.stats.draftTrunks = this.trunks.filter(t => t.status === 'brouillon').length;
    this.stats.totalArticles = this.trunks.reduce((sum, trunk) => sum + trunk.articlesCount, 0);
  }

  applyFilters(): void {
    const formValue = this.searchForm.value;
    
    this.filteredTrunks = this.trunks.filter(trunk => {
      const matchesSearch = !formValue.searchTerm || 
        trunk.name.toLowerCase().includes(formValue.searchTerm.toLowerCase()) ||
        trunk.groups.some(group => group.toLowerCase().includes(formValue.searchTerm.toLowerCase()));
      
      const matchesType = !formValue.trunkType 
        || trunk.type === formValue.trunkType 
        || (formValue.trunkType === 'complementaire' && trunk.type === 'TAC');
      const matchesEnseigne = !formValue.enseigne || trunk.enseigne === formValue.enseigne;

      return matchesSearch && matchesType && matchesEnseigne;
    });
  }

  clearFilters(): void {
    this.searchForm.reset({ searchTerm: '', enseigne: '', trunkType: '' });
    this.filteredTrunks = [...this.trunks];
  }

  createTrunk(): void {
    this.selectedEnseigne = this.searchForm.value.enseigne || '';
    this.dialogRef = this.dialog.open(this.enseigneDialog, { width: '420px' });
    this.dialogRef.afterClosed().subscribe(result => {
      if (result && this.selectedEnseigne) {
        this.router.navigate(['/create-trunk'], { queryParams: { enseigne: this.selectedEnseigne } });
      }
    });
  }

  onCancelEnseigne(): void {
    this.dialogRef?.close(false);
  }

  onValidateEnseigne(): void {
    this.dialogRef?.close(true);
  }

  editTrunk(trunk: Trunk): void {
    console.log('Éditer le tronc (pré-rempli):', trunk.name);
    // Rediriger vers la page de création de tronc avec pré-remplissage
    this.router.navigate(['/create-trunk'], {
      queryParams: {
        id: trunk.id,
        mode: 'edit',
        name: trunk.name,
        enseigne: trunk.enseigne || '',
        // Angular encode les tableaux en params répétés; lecture via getAll()
        groups: trunk.groups,
        attributes: trunk.attributes
      }
    });
  }

  /**
   * Modifier les assortiments du tronc (action Liste)
   */
  manageAssortments(trunk: Trunk): void {
    console.log('Modifier les assortiments du tronc:', trunk.name);
    // Naviguer vers la page de contrôle du tronc pour gérer ses assortiments
    this.router.navigate(['/trunk-control', encodeURIComponent(trunk.name)]);
  }

  duplicateTrunk(trunk: Trunk): void {
    console.log('Dupliquer le tronc:', trunk.name);
    this.snackBar.open(`Tronc "${trunk.name}" dupliqué avec succès`, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  deleteTrunk(trunk: Trunk): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le tronc "${trunk.name}" ?`)) {
      this.trunks = this.trunks.filter(t => t.id !== trunk.id);
      this.applyFilters();
      this.calculateStats();
      
      this.snackBar.open(`Tronc "${trunk.name}" supprimé`, 'Fermer', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    }
  }

  viewTrunkDetails(trunk: Trunk): void {
    console.log('Voir les détails du tronc:', trunk.name);
    this.snackBar.open(`Affichage des détails du tronc "${trunk.name}"`, 'Fermer', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'actif': return 'status-active';
      case 'brouillon': return 'status-draft';
      case 'archive': return 'status-archived';
      default: return '';
    }
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'TAC': return 'type-tac';
      case 'TAN': return 'type-tan';
      case 'complementaire': return 'type-complementaire';
      default: return '';
    }
  }

  getEnseigneLabel(val?: string): string {
    const e = this.enseignes.find(x => x.value === val);
    return e ? e.label : (val || '');
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }

  private computeHierarchyMetaByTrunk(articles: Article[]): Record<string, { levels: number[]; univers: string[]; familles: string[]; sousFamilles: string[] }> {
    const meta: Record<string, { levels: number[]; univers: string[]; familles: string[]; sousFamilles: string[] }> = {};
    // Grouper les articles par tronc
    const byTrunk = new Map<string, Article[]>();
    for (const a of articles) {
      const trunkId = a.trunkId;
      if (!trunkId) continue;
      if (!byTrunk.has(trunkId)) byTrunk.set(trunkId, []);
      byTrunk.get(trunkId)!.push(a);
    }

    // Construire les sets par tronc
    for (const [trunkId, trunkArticles] of byTrunk.entries()) {
      const levelSet = new Set<number>();
      const universSet = new Set<string>();
      const famillesSet = new Set<string>();
      const sousFamillesSet = new Set<string>();

      for (const a of trunkArticles) {
        const rawLevel = (a as any).trunk_level ?? a.level;
        const lvl = typeof rawLevel !== 'undefined' ? Number(rawLevel) : undefined;
        if (typeof lvl === 'number') levelSet.add(lvl);

        if (a.univers) universSet.add(a.univers);
        if (a.famille) famillesSet.add(a.famille);
        if (a.sousFamille) sousFamillesSet.add(a.sousFamille);
      }

      meta[trunkId] = {
        levels: Array.from(levelSet).sort((a, b) => a - b),
        univers: Array.from(universSet).sort((a, b) => a.localeCompare(b)),
        familles: Array.from(famillesSet).sort((a, b) => a.localeCompare(b)),
        sousFamilles: Array.from(sousFamillesSet).sort((a, b) => a.localeCompare(b))
      };
    }

    return meta;
  }

  private getDerivedStatus(trunk: Trunk): 'actif' | 'brouillon' | 'archive' {
    if (trunk.status === 'archive') return 'archive';
    const hasArticles = (trunk.articlesCount || 0) > 0;
    const hasStores = (trunk.storesCount || 0) > 0;
    const hasEnseigne = !!trunk.enseigne && trunk.enseigne.trim().length > 0;
    return (hasArticles && hasStores && hasEnseigne) ? 'actif' : 'brouillon';
  }

  // Accesseurs pour le template
  getTrunkLevels(trunk: Trunk): number[] {
    return this.trunkMetaById[trunk.id]?.levels ?? [];
  }

  getTrunkUnivers(trunk: Trunk): string[] {
    return this.trunkMetaById[trunk.id]?.univers ?? [];
  }

  getTrunkFamilles(trunk: Trunk): string[] {
    return this.trunkMetaById[trunk.id]?.familles ?? [];
  }

  getTrunkSousFamilles(trunk: Trunk): string[] {
    return this.trunkMetaById[trunk.id]?.sousFamilles ?? [];
  }
}
