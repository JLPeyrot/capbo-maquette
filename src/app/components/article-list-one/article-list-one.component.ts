import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material-module';
import { Article } from '../../services/articles.service';
import { MatDialog } from '@angular/material/dialog';
import { AssortmentDialogComponent } from '../../pages/articles-list/assortment-dialog.component';

@Component({
  selector: 'app-article-list-one',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './article-list-one.component.html',
  styleUrls: ['./article-list-one.component.scss']
})
export class ArticleListOneComponent {
  @Input() filteredArticles: Article[] = [];
  @Input() pageSize: number = 30;
  @Input() currentPage: number = 0;
  @Input() allSelected: boolean = false;
  @Input() someSelected: boolean = false;
  @Input() trunkNameById?: Record<string, string>;
  @Input() getAssortTypeShort?: (article: Article) => string;
  @Input() isArticleSelected!: (code: string) => boolean;
  @Input() onArticleSelect!: (code: string, checked: boolean) => void;
  @Input() hasVendable!: (code: string) => boolean;
  @Input() hasCommandable!: (code: string) => boolean;
  @Input() firstPage!: () => void;
  @Input() prevPage!: () => void;
  @Input() nextPage!: () => void;
  @Input() lastPage!: () => void;
  @Input() toggleAll!: () => void;
  @Input() searchTerm: string = '';
  @Input() onSearchChange!: (term: string) => void;
  @Input() showMetaPills: boolean = false;
  emitSearch(term: string): void {
    if (this.onSearchChange) this.onSearchChange(term);
  }
  constructor(private dialog: MatDialog) {}
  openAssortmentDialog(article: Article): void {
    this.dialog.open(AssortmentDialogComponent, {
      data: { article: { reference: article.code } },
      width: 'min(1800px, 99vw)',
      maxWidth: '99vw',
      maxHeight: '96vh'
    });
  }
  getDeploymentTypologyIcon(article: Article): string {
    const t = article.deployment_typology;
    if (t === 'ferme') return 'lock';
    if (t === 'ouvert') return 'lock_open';
    if (t === 'mixte') return 'settings';
    return '';
  }
}
