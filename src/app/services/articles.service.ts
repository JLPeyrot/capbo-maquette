import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, catchError, of } from 'rxjs';
import { TrunkHierarchyNode } from '../interfaces/trunk-hierarchy.interface';

export interface Article {
  code: string;
  libelle: string;
  univers: string;
  famille: string;
  sousFamille: string;
}

export interface ArticlesData {
  articles: Article[];
}

@Injectable({
  providedIn: 'root'
})
export class ArticlesService {
  private articlesSubject = new BehaviorSubject<Article[]>([]);
  public articles$ = this.articlesSubject.asObservable();

  private hierarchySubject = new BehaviorSubject<TrunkHierarchyNode[]>([]);
  public hierarchy$ = this.hierarchySubject.asObservable();

  private currentTrunkName: string = 'TRONC ACTUEL'; // Nom du tronc actuel

  constructor(private http: HttpClient) {
    this.loadArticles();
  }

  /**
   * Charge les articles depuis le fichier JSON
   */
  private loadArticles(): void {
    console.log('Tentative de chargement des articles...');
    this.http.get<ArticlesData>('/data/articles.json')
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des articles:', error);
          console.error('Type d\'erreur:', error.constructor.name);
          console.error('Message:', error.message);
          console.error('Status:', error.status);
          console.error('URL:', error.url);
          return of({ articles: [] });
        })
      )
      .subscribe({
        next: (data) => {
          console.log('Articles chargés avec succès:', data.articles.length, 'articles');
          this.articlesSubject.next(data.articles);
          this.buildHierarchy(data.articles);
        },
        error: (error) => {
          console.error('Erreur dans subscribe:', error);
        }
      });
  }

  /**
   * Construit la hiérarchie à partir des articles
   */
  private buildHierarchy(articles: Article[]): void {
    const hierarchy: TrunkHierarchyNode[] = [];

    // Créer le nœud racine avec le nom du tronc dynamique
    const trunkRoot: TrunkHierarchyNode = {
      id: 'trunk-root',
      name: this.currentTrunkName,
      type: 'trunk',
      level: 0,
      children: []
    };

    // Grouper par univers (Rayon)
    const universByName = new Map<string, Article[]>();
    articles.forEach(article => {
      if (!universByName.has(article.univers)) {
        universByName.set(article.univers, []);
      }
      universByName.get(article.univers)!.push(article);
    });

    // Créer les nœuds pour chaque univers (Rayon)
    universByName.forEach((universArticles, universName) => {
      const universNode: TrunkHierarchyNode = {
        id: `univers-${universName.toLowerCase().replace(/\s+/g, '-')}`,
        name: universName,
        type: 'department',
        level: 1,
        articlesCount: universArticles.length,
        children: []
      };

      // Grouper par famille dans cet univers
      const famillesByName = new Map<string, Article[]>();
      universArticles.forEach(article => {
        if (!famillesByName.has(article.famille)) {
          famillesByName.set(article.famille, []);
        }
        famillesByName.get(article.famille)!.push(article);
      });

      // Créer les nœuds pour chaque famille
      famillesByName.forEach((familleArticles, familleName) => {
        const familleNode: TrunkHierarchyNode = {
          id: `famille-${universName.toLowerCase().replace(/\s+/g, '-')}-${familleName.toLowerCase().replace(/\s+/g, '-')}`,
          name: familleName,
          type: 'family',
          level: 2,
          articlesCount: familleArticles.length,
          children: []
        };

        // Grouper par sous-famille dans cette famille
        const sousFamillesByName = new Map<string, Article[]>();
        familleArticles.forEach(article => {
          if (!sousFamillesByName.has(article.sousFamille)) {
            sousFamillesByName.set(article.sousFamille, []);
          }
          sousFamillesByName.get(article.sousFamille)!.push(article);
        });

        // Créer les nœuds pour chaque sous-famille
        sousFamillesByName.forEach((sousFamilleArticles, sousFamilleName) => {
          const sousFamilleNode: TrunkHierarchyNode = {
            id: `sous-famille-${universName.toLowerCase().replace(/\s+/g, '-')}-${familleName.toLowerCase().replace(/\s+/g, '-')}-${sousFamilleName.toLowerCase().replace(/\s+/g, '-')}`,
            name: sousFamilleName,
            type: 'sub-family',
            level: 3,
            articlesCount: sousFamilleArticles.length
          };

          familleNode.children!.push(sousFamilleNode);
        });

        // Trier les sous-familles par nom
        familleNode.children!.sort((a, b) => a.name.localeCompare(b.name));
        universNode.children!.push(familleNode);
      });

      // Trier les familles par nom
      universNode.children!.sort((a, b) => a.name.localeCompare(b.name));
      trunkRoot.children!.push(universNode);
    });

    // Trier les univers par nom
    trunkRoot.children!.sort((a, b) => a.name.localeCompare(b.name));

    hierarchy.push(trunkRoot);
    this.hierarchySubject.next(hierarchy);
  }

  /**
   * Obtient tous les articles
   */
  getArticles(): Observable<Article[]> {
    return this.articles$;
  }

  /**
   * Obtient la hiérarchie des troncs
   */
  getHierarchy(): Observable<TrunkHierarchyNode[]> {
    return this.hierarchy$;
  }

  /**
   * Filtre les articles par famille
   */
  getArticlesByFamily(univers: string, famille: string): Observable<Article[]> {
    return this.articles$.pipe(
      map(articles => articles.filter(article => 
        article.univers === univers && article.famille === famille
      ))
    );
  }

  /**
   * Récupère les articles par sous-famille
   */
  getArticlesBySubFamily(univers: string, famille: string, sousFamille: string): Observable<Article[]> {
    return this.getArticles().pipe(
      map(articles => articles.filter(article => 
        article.univers === univers && 
        article.famille === famille && 
        article.sousFamille === sousFamille
      ))
    );
  }

  /**
   * Filtre les articles par univers
   */
  getArticlesByUnivers(univers: string): Observable<Article[]> {
    return this.articles$.pipe(
      map(articles => articles.filter(article => article.univers === univers))
    );
  }

  /**
   * Recherche d'articles par terme
   */
  searchArticles(searchTerm: string): Observable<Article[]> {
    return this.articles$.pipe(
      map(articles => articles.filter(article =>
        article.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.univers.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.famille.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.sousFamille.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    );
  }

  /**
   * Recharge les données
   */
  refreshData(): void {
    this.loadArticles();
  }

  /**
   * Met à jour le nom du tronc et reconstruit la hiérarchie
   */
  setTrunkName(trunkName: string): void {
    this.currentTrunkName = trunkName;
    // Reconstruire la hiérarchie avec le nouveau nom
    const currentArticles = this.articlesSubject.value;
    if (currentArticles.length > 0) {
      this.buildHierarchy(currentArticles);
    }
  }
}