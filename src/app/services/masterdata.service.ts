import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, of } from 'rxjs';
import { 
  MasterData, 
  Group, 
  Attribute, 
  TrunkType, 
  Store, 
  Status, 
  Category, 
  User, 
  Item 
} from '../shared/interfaces/masterdata.interfaces';

@Injectable({
  providedIn: 'root'
})
export class MasterdataService {
  private masterDataSubject = new BehaviorSubject<MasterData | null>(null);
  public masterData$ = this.masterDataSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadMasterData();
  }

  /**
   * Charge les données maître (maintenant en dur pour éviter les problèmes d'injection)
   */
  private loadMasterData(): void {
    const masterData: MasterData = {
      groups: [
        {
          id: 'group-1',
          name: 'Électronique',
          description: 'Appareils et composants électroniques',
          category: 'technology'
        },
        {
          id: 'group-2',
          name: 'Mobilier',
          description: 'Meubles et équipements de bureau',
          category: 'furniture'
        },
        {
          id: 'group-3',
          name: 'Véhicules',
          description: 'Véhicules et équipements de transport',
          category: 'transport'
        },
        {
          id: 'group-4',
          name: 'Outillage',
          description: 'Outils et équipements de travail',
          category: 'tools'
        },
        {
          id: 'group-5',
          name: 'Informatique',
          description: 'Matériel et logiciels informatiques',
          category: 'technology'
        }
      ],
      attributes: [
        {
          id: 'attr-1',
          name: 'Marque',
          description: 'Marque du produit',
          type: 'text',
          required: true,
          groupIds: ['group-1', 'group-3', 'group-5']
        },
        {
          id: 'attr-2',
          name: 'Modèle',
          description: 'Modèle du produit',
          type: 'text',
          required: true,
          groupIds: ['group-1', 'group-3', 'group-5']
        },
        {
          id: 'attr-3',
          name: 'Couleur',
          description: 'Couleur du produit',
          type: 'select',
          required: false,
          options: ['Rouge', 'Bleu', 'Vert', 'Noir', 'Blanc', 'Gris'],
          groupIds: ['group-1', 'group-2', 'group-3']
        },
        {
          id: 'attr-4',
          name: 'Dimensions',
          description: 'Dimensions du produit (L x l x h)',
          type: 'text',
          required: false,
          groupIds: ['group-2', 'group-4']
        },
        {
          id: 'attr-5',
          name: 'Poids',
          description: 'Poids du produit en kg',
          type: 'number',
          required: false,
          groupIds: ['group-1', 'group-2', 'group-3', 'group-4']
        },
        {
          id: 'attr-6',
          name: 'Année',
          description: 'Année de fabrication',
          type: 'number',
          required: false,
          groupIds: ['group-1', 'group-2', 'group-3', 'group-4', 'group-5']
        },
        {
          id: 'attr-7',
          name: 'État',
          description: 'État du produit',
          type: 'select',
          required: true,
          options: ['Neuf', 'Très bon état', 'Bon état', 'État moyen', 'Mauvais état'],
          groupIds: ['group-1', 'group-2', 'group-3', 'group-4', 'group-5']
        },
        {
          id: 'attr-8',
          name: 'Numéro de série',
          description: 'Numéro de série unique',
          type: 'text',
          required: false,
          groupIds: ['group-1', 'group-5']
        }
      ],
      trunkTypes: [
        {
          id: 'trunk-1',
          name: 'Tronc Standard',
          description: 'Tronc pour articles généraux',
          maxItems: 100,
          features: ['Tri automatique', 'Étiquetage']
        },
        {
          id: 'trunk-2',
          name: 'Tronc Premium',
          description: 'Tronc pour articles de valeur',
          maxItems: 50,
          features: ['Tri automatique', 'Étiquetage', 'Sécurité renforcée', 'Traçabilité']
        },
        {
          id: 'trunk-3',
          name: 'Tronc Express',
          description: 'Tronc pour traitement rapide',
          maxItems: 200,
          features: ['Tri automatique', 'Traitement prioritaire']
        }
      ],
      stores: [
        {
          id: 'store-1',
          name: 'Entrepôt Central Paris',
          description: 'Entrepôt principal de la région parisienne',
          location: 'Paris, France',
          capacity: 10000,
          type: 'warehouse'
        },
        {
          id: 'store-2',
          name: 'Magasin Lyon',
          description: 'Point de vente Lyon centre',
          location: 'Lyon, France',
          capacity: 500,
          type: 'office'
        },
        {
          id: 'store-3',
          name: 'Atelier Marseille',
          description: 'Atelier de réparation et maintenance',
          location: 'Marseille, France',
          capacity: 200,
          type: 'workshop'
        },
        {
          id: 'store-4',
          name: 'Archive Bordeaux',
          description: 'Centre d\'archivage et stockage longue durée',
          location: 'Bordeaux, France',
          capacity: 5000,
          type: 'archive'
        },
        {
          id: 'store-5',
          name: 'Bureau Lille',
          description: 'Bureau administratif régional',
          location: 'Lille, France',
          capacity: 100,
          type: 'office'
        }
      ],
      statuses: [
        {
          id: 'status-1',
          name: 'En attente',
          description: 'Article en attente de traitement',
          color: '#FFA500'
        },
        {
          id: 'status-2',
          name: 'En cours',
          description: 'Article en cours de traitement',
          color: '#007BFF'
        },
        {
          id: 'status-3',
          name: 'Terminé',
          description: 'Article traité avec succès',
          color: '#28A745'
        },
        {
          id: 'status-4',
          name: 'Erreur',
          description: 'Erreur lors du traitement',
          color: '#DC3545'
        }
      ],
      categories: [
        {
          id: 'cat-1',
          name: 'Technologie',
          description: 'Produits technologiques et électroniques'
        },
        {
          id: 'cat-2',
          name: 'Mobilier',
          description: 'Meubles et équipements'
        },
        {
          id: 'cat-3',
          name: 'Transport',
          description: 'Véhicules et équipements de transport'
        },
        {
          id: 'cat-4',
          name: 'Outils',
          description: 'Outillage et équipements de travail'
        }
      ],
      users: [
        {
          id: 'user-1',
          name: 'Jean Dupont',
          email: 'jean.dupont@example.com',
          role: 'admin',
          department: 'IT'
        },
        {
          id: 'user-2',
          name: 'Marie Martin',
          email: 'marie.martin@example.com',
          role: 'manager',
          department: 'Logistics'
        },
        {
          id: 'user-3',
          name: 'Pierre Durand',
          email: 'pierre.durand@example.com',
          role: 'operator',
          department: 'Warehouse'
        }
      ],
      sampleItems: [
        {
          id: 'item-1',
          name: 'Ordinateur portable Dell',
          groupId: 'group-5',
          attributes: {
            'attr-1': 'Dell',
            'attr-2': 'Inspiron 15',
            'attr-7': 'Très bon état'
          },
          statusId: 'status-2',
          storeId: 'store-1',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: 'item-2',
          name: 'Chaise de bureau',
          groupId: 'group-2',
          attributes: {
            'attr-3': 'Noir',
            'attr-4': '60x60x120',
            'attr-7': 'Bon état'
          },
          statusId: 'status-1',
          storeId: 'store-2',
          createdAt: '2024-01-20T14:30:00Z',
          updatedAt: '2024-01-20T14:30:00Z'
        }
      ]
    };

    this.masterDataSubject.next(masterData);
  }

  /**
   * Obtient toutes les données maître
   */
  getMasterData(): Observable<MasterData | null> {
    return this.masterData$;
  }

  /**
   * Obtient tous les groupes
   */
  getGroups(): Observable<Group[]> {
    return this.masterData$.pipe(
      map(data => data?.groups || [])
    );
  }

  /**
   * Obtient un groupe par son ID
   */
  getGroupById(id: string): Observable<Group | undefined> {
    return this.masterData$.pipe(
      map(data => data?.groups.find(group => group.id === id))
    );
  }

  /**
   * Obtient tous les attributs
   */
  getAttributes(): Observable<Attribute[]> {
    return this.masterData$.pipe(
      map(data => data?.attributes || [])
    );
  }

  /**
   * Obtient les attributs pour un groupe spécifique
   */
  getAttributesForGroup(groupId: string): Observable<Attribute[]> {
    return this.masterData$.pipe(
      map(data => data?.attributes.filter(attr => attr.groupIds.includes(groupId)) || [])
    );
  }

  /**
   * Obtient tous les types de tronc
   */
  getTrunkTypes(): Observable<TrunkType[]> {
    return this.masterData$.pipe(
      map(data => data?.trunkTypes || [])
    );
  }

  /**
   * Obtient un type de tronc par son ID
   */
  getTrunkTypeById(id: string): Observable<TrunkType | undefined> {
    return this.masterData$.pipe(
      map(data => data?.trunkTypes.find(type => type.id === id))
    );
  }

  /**
   * Obtient tous les magasins/entrepôts
   */
  getStores(): Observable<Store[]> {
    return this.masterData$.pipe(
      map(data => data?.stores || [])
    );
  }

  /**
   * Obtient un magasin par son ID
   */
  getStoreById(id: string): Observable<Store | undefined> {
    return this.masterData$.pipe(
      map(data => data?.stores.find(store => store.id === id))
    );
  }

  /**
   * Obtient tous les statuts
   */
  getStatuses(): Observable<Status[]> {
    return this.masterData$.pipe(
      map(data => data?.statuses || [])
    );
  }

  /**
   * Obtient un statut par son ID
   */
  getStatusById(id: string): Observable<Status | undefined> {
    return this.masterData$.pipe(
      map(data => data?.statuses.find(status => status.id === id))
    );
  }

  /**
   * Obtient toutes les catégories
   */
  getCategories(): Observable<Category[]> {
    return this.masterData$.pipe(
      map(data => data?.categories || [])
    );
  }

  /**
   * Obtient une catégorie par son ID
   */
  getCategoryById(id: string): Observable<Category | undefined> {
    return this.masterData$.pipe(
      map(data => data?.categories.find(category => category.id === id))
    );
  }

  /**
   * Obtient tous les utilisateurs
   */
  getUsers(): Observable<User[]> {
    return this.masterData$.pipe(
      map(data => data?.users || [])
    );
  }

  /**
   * Obtient un utilisateur par son ID
   */
  getUserById(id: string): Observable<User | undefined> {
    return this.masterData$.pipe(
      map(data => data?.users.find(user => user.id === id))
    );
  }

  /**
   * Obtient tous les éléments d'exemple
   */
  getSampleItems(): Observable<Item[]> {
    return this.masterData$.pipe(
      map(data => data?.sampleItems || [])
    );
  }

  /**
   * Filtre les éléments par groupe
   */
  getItemsByGroup(groupId: string): Observable<Item[]> {
    return this.masterData$.pipe(
      map(data => data?.sampleItems.filter(item => item.groupId === groupId) || [])
    );
  }

  /**
   * Filtre les éléments par magasin
   */
  getItemsByStore(storeId: string): Observable<Item[]> {
    return this.masterData$.pipe(
      map(data => data?.sampleItems.filter(item => item.storeId === storeId) || [])
    );
  }

  /**
   * Filtre les éléments par statut
   */
  getItemsByStatus(statusId: string): Observable<Item[]> {
    return this.masterData$.pipe(
      map(data => data?.sampleItems.filter(item => item.statusId === statusId) || [])
    );
  }

  /**
   * Recherche d'éléments par nom
   */
  searchItems(searchTerm: string): Observable<Item[]> {
    return this.masterData$.pipe(
      map(data => {
        if (!data || !searchTerm.trim()) return data?.sampleItems || [];
        
        const term = searchTerm.toLowerCase();
        return data.sampleItems.filter(item => 
          item.name.toLowerCase().includes(term) ||
          Object.values(item.attributes).some(value => 
            String(value).toLowerCase().includes(term)
          )
        );
      })
    );
  }

  /**
   * Recharge les données maître
   */
  refreshMasterData(): void {
    this.loadMasterData();
  }
}