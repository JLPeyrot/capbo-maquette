import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, catchError, of, tap } from 'rxjs';
import { TrunkHierarchyNode } from '../interfaces/trunk-hierarchy.interface';

export interface Article {
  code: string;
  libelle: string;
  univers: string;
  famille: string;
  sousFamille: string;
  attributes?: string[]; // Codes d’attributs magasin appliqués
  trunkId?: string; // Identifiant du tronc assigné (unique)
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
    this.http.get<ArticlesData>('/data/articles_ref.json')
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
          const normalized = (data.articles || []).map((a: any) => {
            const trunkId = a.trunkId ?? a.trunk_id;
            return trunkId ? { ...a, trunkId } : a;
          });
          console.log('Articles chargés avec succès:', normalized.length, 'articles');
          this.articlesSubject.next(normalized);
          this.buildHierarchy(normalized as Article[]);
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

  /**
   * Met à jour les attributs pour une liste d’articles côté serveur
   */
  updateAttributesForArticles(articleCodes: string[], attributes: string[]): Observable<{ updated: number, articles: Article[] }> {
    return this.http.post<{ updated: number, articles: Article[] }>(
      '/api/articles/update-attributes',
      { articleCodes, attributes }
    ).pipe(
      catchError(error => {
        console.error('Erreur MAJ attributs:', error);
        return of({ updated: 0, articles: this.articlesSubject.value });
      }),
      tap(result => {
        // Mettre à jour le store local immédiatement
        this.articlesSubject.next(result.articles);
        this.buildHierarchy(result.articles);
      })
    );
  }

  /**
   * Supprime une liste d’attributs des articles côté serveur (set-difference)
   */
  removeAttributesForArticles(articleCodes: string[], attributesToRemove: string[]): Observable<{ updated: number, articles: Article[] }> {
    return this.http.post<{ updated: number, articles: Article[] }>(
      '/api/articles/remove-attributes',
      { articleCodes, attributesToRemove }
    ).pipe(
      catchError(error => {
        console.error('Erreur suppression attributs:', error);
        return of({ updated: 0, articles: this.articlesSubject.value });
      }),
      tap(result => {
        this.articlesSubject.next(result.articles);
        this.buildHierarchy(result.articles);
      })
    );
  }

  /**
   * Supprime tous les attributs des articles côté serveur (retire la clé attributes)
   */
  removeAllAttributesForArticles(articleCodes: string[]): Observable<{ updated: number, articles: Article[] }> {
    return this.http.post<{ updated: number, articles: Article[] }>(
      '/api/articles/remove-all-attributes',
      { articleCodes }
    ).pipe(
      catchError(error => {
        console.error('Erreur suppression totale attributs:', error);
        return of({ updated: 0, articles: this.articlesSubject.value });
      }),
      tap(result => {
        this.articlesSubject.next(result.articles);
        this.buildHierarchy(result.articles);
      })
    );
  }

  /**
   * Assigne un tronc unique à une liste d’articles côté serveur (écrit trunkId)
   */
  assignArticlesToTrunk(articleCodes: string[], trunkId: string): Observable<{ updated: number, articles: Article[] }> {
    return this.http.post<{ updated: number, articles: Article[] }>(
      '/api/articles/assign-trunk',
      { articleCodes, trunkId }
    ).pipe(
      catchError(error => {
        console.error('Erreur assignation tronc:', error);
        return of({ updated: 0, articles: this.articlesSubject.value });
      }),
      tap(result => {
        const normalized = (result.articles || []).map((a: any) => {
          const tid = a.trunkId ?? a.trunk_id;
          return tid ? { ...a, trunkId: tid } : a;
        });
        this.articlesSubject.next(normalized as Article[]);
        this.buildHierarchy(normalized as Article[]);
      })
    );
  }
}
