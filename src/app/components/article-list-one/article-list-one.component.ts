import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material-module';
import { Article } from '../../services/articles.service';

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
}
