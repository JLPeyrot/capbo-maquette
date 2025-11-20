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
  level?: number; // Niveau de l’article dans le tronc
  commandable?: { dateDebut: string | null; dateFin: string | null; actif?: boolean };
  vendable?: { dateDebut: string | null; dateFin: string | null; actif?: boolean };
  deployment_typology?: 'ferme' | 'mixte' | 'ouvert';
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

  private currentTrunkName: string = 'Tronc'; // Nom du tronc affiché

  constructor(private http: HttpClient) {
    this.loadArticles();
  }

  /**
   * Charge les articles depuis le fichier JSON
   */
  private loadArticles(): void {
    const loadText = (path: string) => this.http.get(path, { responseType: 'text' }).pipe(
      catchError(() => of(null))
    );

    loadText('/data/articles_ref.json').subscribe(text => {
      let data: ArticlesData = { articles: [] };
      if (text) {
        try {
          const parsed = JSON.parse(text);
          data = { articles: Array.isArray(parsed.articles) ? parsed.articles : [] };
        } catch {}
      }
      this.processArticles(data);
    });
  }

  private processArticles(data: ArticlesData): void {
          const normalized = (data.articles || []).map((a: any) => {
            const trunkId = a.trunkId ?? a.trunk_id;
            const levelFromJson = typeof a.trunk_level !== 'undefined' ? a.trunk_level : a.level;
            const level = typeof levelFromJson !== 'undefined' ? Number(levelFromJson) : undefined;
            if (trunkId) {
              // Assurer un niveau par défaut à 1 pour les articles rattachés à un tronc
              return { ...a, trunkId, level: level ?? 1 };
            }
            return { ...a, level };
          });
          // Charger et fusionner les métadonnées d'assortiments (commandable/vendable) avec fallback
          const loadAssortiText = (path: string) => this.http.get(path, { responseType: 'text' }).pipe(catchError(() => of(null)));

          loadAssortiText('/data/article_assorti.json').subscribe(txt => {
            let assortiments: { articleId: string; commandable?: { dateDebut: string; dateFin: string; actif?: boolean }; vendable?: { dateDebut: string; dateFin: string; actif?: boolean } }[] = [];
            if (txt) {
              try {
                const parsed = JSON.parse(txt);
                assortiments = Array.isArray(parsed.assortiments) ? parsed.assortiments : [];
              } catch {}
            }
            this.mergeAssortimentsAndBuild(normalized, assortiments);
          });
  }

  private mergeAssortimentsAndBuild(normalized: any[], assortiments: { articleId: string; commandable?: { dateDebut: string; dateFin: string; actif?: boolean }; vendable?: { dateDebut: string; dateFin: string; actif?: boolean } }[]): void {
            const byArticleId = new Map<string, { commandable?: { dateDebut: string; dateFin: string; actif?: boolean }; vendable?: { dateDebut: string; dateFin: string; actif?: boolean } }>();
            (assortiments || []).forEach(a => byArticleId.set(a.articleId, { commandable: a.commandable, vendable: a.vendable }));

            const merged = normalized.map(a => {
              const meta = byArticleId.get(a.code);
              return meta ? { ...a, commandable: meta.commandable || null, vendable: meta.vendable || null } : a;
            });

            console.log('Articles chargés avec succès:', merged.length, 'articles');
            this.articlesSubject.next(merged as Article[]);
            this.buildHierarchy(merged as Article[]);
  }

  /**
   * Construit la hiérarchie à partir des articles
   */
  private buildHierarchy(articles: Article[]): void {
    const hierarchy: TrunkHierarchyNode[] = [];

    // Nœud racine: libellé dynamique (ex: "Univers")
    const trunkRoot: TrunkHierarchyNode = {
      id: 'trunk-root',
      name: this.currentTrunkName,
      type: 'trunk',
      level: 0,
      children: []
    };

    // 1) Grouper par univers
    const universByName = new Map<string, Article[]>();
    articles.forEach(article => {
      const uni = article.univers || 'Sans univers';
      if (!universByName.has(uni)) universByName.set(uni, []);
      universByName.get(uni)!.push(article);
    });

    Array.from(universByName.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([universName, universArticles]) => {
        const universNode: TrunkHierarchyNode = {
          id: `univers-${universName.toLowerCase().replace(/\s+/g, '-')}`,
          name: universName,
          type: 'department',
          level: 1,
          articlesCount: universArticles.length,
          children: []
        };

        // 2) Grouper par famille au sein de l’univers
        const famillesByName = new Map<string, Article[]>();
        universArticles.forEach(article => {
          const fam = article.famille || 'Sans famille';
          if (!famillesByName.has(fam)) famillesByName.set(fam, []);
          famillesByName.get(fam)!.push(article);
        });

        Array.from(famillesByName.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .forEach(([familleName, familleArticles]) => {
            const familleNode: TrunkHierarchyNode = {
              id: `famille-${universName.toLowerCase().replace(/\s+/g, '-')}-${familleName.toLowerCase().replace(/\s+/g, '-')}`,
              name: familleName,
              type: 'famille',
              level: 2,
              articlesCount: familleArticles.length,
              children: []
            };

            // 3) Grouper par sous-famille au sein de la famille
            const sousFamillesByName = new Map<string, Article[]>();
            familleArticles.forEach(article => {
              const sub = article.sousFamille || 'Sans sous-famille';
              if (!sousFamillesByName.has(sub)) sousFamillesByName.set(sub, []);
              sousFamillesByName.get(sub)!.push(article);
            });

            Array.from(sousFamillesByName.entries())
              .sort((a, b) => a[0].localeCompare(b[0]))
              .forEach(([sousFamilleName, sousFamilleArticles]) => {
                const sousFamilleNode: TrunkHierarchyNode = {
                  id: `sous-famille-${universName.toLowerCase().replace(/\s+/g, '-')}-${familleName.toLowerCase().replace(/\s+/g, '-')}-${sousFamilleName.toLowerCase().replace(/\s+/g, '-')}`,
                  name: sousFamilleName,
                  type: 'sous-famille',
                  level: 3,
                  articlesCount: sousFamilleArticles.length
                };
                familleNode.children!.push(sousFamilleNode);
              });

            universNode.children!.push(familleNode);
          });

        trunkRoot.children!.push(universNode);
      });

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
          const level = typeof a.level !== 'undefined' ? a.level : undefined;
          return tid ? { ...a, trunkId: tid, level: level ?? 1 } : a;
        });
        this.articlesSubject.next(normalized as Article[]);
        this.buildHierarchy(normalized as Article[]);
      })
    );
  }

  /**
   * Met à jour le niveau pour une liste d’articles côté serveur
   */
  updateLevelForArticles(articleCodes: string[], level: number): Observable<{ updated: number, articles: Article[] }> {
    return this.http.post<{ updated: number, articles: Article[] }>(
      '/api/articles/update-level',
      { articleCodes, level }
    ).pipe(
      catchError(error => {
        console.error('Erreur MAJ niveau:', error);
        return of({ updated: 0, articles: this.articlesSubject.value });
      }),
      tap(result => {
        // Met à jour le store local et reconstruit la hiérarchie
        const normalized = (result.articles || []).map((a: any) => {
          const tid = a.trunkId ?? a.trunk_id;
          const levelFromJson = typeof a.trunk_level !== 'undefined' ? a.trunk_level : a.level;
          const levelVal = typeof levelFromJson !== 'undefined' ? Number(levelFromJson) : undefined;
          return tid ? { ...a, trunkId: tid, level: levelVal ?? 1 } : { ...a, level: levelVal };
        });
        this.articlesSubject.next(normalized as Article[]);
        this.buildHierarchy(normalized as Article[]);
      })
    );
  }

  /**
   * Met à jour la date de début (assortiments) pour une liste d’articles côté serveur
   * N’affecte que article_assorti.json; après succès, recharge les données.
   */
  updateStartDateForArticles(articleCodes: string[], trunkId: string, metatype: 'commandable' | 'vendable', dateDebut: string): Observable<{ updated: number }> {
    return this.http.post<{ updated: number }>(
      '/api/assortiments/update-start-date-bulk',
      { articleCodes, trunkId, metatype, dateDebut }
    ).pipe(
      catchError(error => {
        console.error('Erreur MAJ date debut:', error);
        return of({ updated: 0 });
      }),
      tap(() => {
        // Recharge articles pour re-fusionner avec article_assorti.json
        this.refreshData();
      })
    );
  }

  /**
   * Met à jour la date de fin (assortiments) pour une liste d’articles côté serveur
   * N’affecte que article_assorti.json; après succès, recharge les données.
   */
  updateEndDateForArticles(articleCodes: string[], trunkId: string, metatype: 'commandable' | 'vendable', dateFin: string): Observable<{ updated: number }> {
    return this.http.post<{ updated: number }>(
      '/api/assortiments/update-end-date-bulk',
      { articleCodes, trunkId, metatype, dateFin }
    ).pipe(
      catchError(error => {
        console.error('Erreur MAJ date fin:', error);
        return of({ updated: 0 });
      }),
      tap(() => {
        // Recharge articles pour re-fusionner avec article_assorti.json
        this.refreshData();
      })
    );
  }

  /**
   * Met à jour la typologie de déploiment pour une liste d’articles côté serveur
   */
  updateDeploymentTypologyForArticles(articleCodes: string[], typology: 'ferme' | 'mixte' | 'ouvert'): Observable<{ updated: number, articles: Article[] }> {
    return this.http.post<{ updated: number, articles: Article[] }>(
      '/api/articles/update-deployment-typology',
      { articleCodes, typology }
    ).pipe(
      catchError(error => {
        console.error('Erreur MAJ typologie de déploiment:', error);
        return of({ updated: 0, articles: this.articlesSubject.value });
      }),
      tap(result => {
        this.articlesSubject.next(result.articles);
        this.buildHierarchy(result.articles);
      })
    );
  }
}
