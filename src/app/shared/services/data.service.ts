import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ProductData {
  univers: string;
  famille: string;
  sousFamille: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private dataSubject = new BehaviorSubject<ProductData[]>([]);
  public data$ = this.dataSubject.asObservable();

  private rawData: ProductData[] = [
    { univers: 'Électroménager', famille: 'Lavage', sousFamille: 'Lave-linge' },
    { univers: 'Électroménager', famille: 'Lavage', sousFamille: 'Sèche-linge' },
    { univers: 'Électroménager', famille: 'Lavage', sousFamille: 'Lave-linge séchant' },
    { univers: 'Électroménager', famille: 'Froid', sousFamille: 'Réfrigérateur' },
    { univers: 'Électroménager', famille: 'Froid', sousFamille: 'Congélateur' },
    { univers: 'Électroménager', famille: 'Froid', sousFamille: 'Cave à vin' },
    { univers: 'Électroménager', famille: 'Cuisson', sousFamille: 'Fours' },
    { univers: 'Électroménager', famille: 'Cuisson', sousFamille: 'Tables de cuisson' },
    { univers: 'Électroménager', famille: 'Cuisson', sousFamille: 'Micro-ondes' },
    { univers: 'Électroménager', famille: 'Cuisson', sousFamille: 'Hottes' },
    { univers: 'Électroménager', famille: 'Entretien', sousFamille: 'Aspirateurs' },
    { univers: 'Électroménager', famille: 'Entretien', sousFamille: 'Nettoyeurs vapeur' },
    { univers: 'Électroménager', famille: 'Entretien', sousFamille: 'Accessoires entretien' },
    { univers: 'Image & Son', famille: 'Téléviseurs', sousFamille: 'Téléviseurs LED' },
    { univers: 'Image & Son', famille: 'Téléviseurs', sousFamille: 'Téléviseurs OLED' },
    { univers: 'Image & Son', famille: 'Téléviseurs', sousFamille: 'Téléviseurs QLED' },
    { univers: 'Image & Son', famille: 'Audio', sousFamille: 'Barres de son' },
    { univers: 'Image & Son', famille: 'Audio', sousFamille: 'Enceintes Bluetooth' },
    { univers: 'Image & Son', famille: 'Audio', sousFamille: 'Chaînes Hi-Fi' },
    { univers: 'Image & Son', famille: 'Photo & Vidéo', sousFamille: 'Appareils photo' },
    { univers: 'Image & Son', famille: 'Photo & Vidéo', sousFamille: 'Caméras' },
    { univers: 'Image & Son', famille: 'Photo & Vidéo', sousFamille: 'Accessoires photo' },
    { univers: 'Informatique', famille: 'Ordinateurs portables', sousFamille: 'Bureautique' },
    { univers: 'Informatique', famille: 'Ordinateurs portables', sousFamille: 'Gaming' },
    { univers: 'Informatique', famille: 'Ordinateurs de bureau', sousFamille: 'All-in-One' },
    { univers: 'Informatique', famille: 'Ordinateurs de bureau', sousFamille: 'Tour' },
    { univers: 'Informatique', famille: 'Impression', sousFamille: 'Imprimantes' },
    { univers: 'Informatique', famille: 'Impression', sousFamille: 'Cartouches & toners' },
    { univers: 'Informatique', famille: 'Stockage', sousFamille: 'Disques durs externes' },
    { univers: 'Informatique', famille: 'Stockage', sousFamille: 'Clés USB' },
    { univers: 'Téléphonie', famille: 'Smartphones', sousFamille: 'Android' },
    { univers: 'Téléphonie', famille: 'Smartphones', sousFamille: 'iPhone' },
    { univers: 'Téléphonie', famille: 'Accessoires', sousFamille: 'Coques & protections' },
    { univers: 'Téléphonie', famille: 'Accessoires', sousFamille: 'Chargeurs & câbles' },
    { univers: 'Objets connectés', famille: 'Maison connectée', sousFamille: 'Éclairage' },
    { univers: 'Objets connectés', famille: 'Maison connectée', sousFamille: 'Prises connectées' },
    { univers: 'Objets connectés', famille: 'Maison connectée', sousFamille: 'Sécurité' },
    { univers: 'Objets connectés', famille: 'Santé connectée', sousFamille: 'Montres connectées' },
    { univers: 'Objets connectés', famille: 'Santé connectée', sousFamille: 'Balances connectées' },
    { univers: 'Cuisine', famille: 'Petit-déjeuner', sousFamille: 'Cafetières' },
    { univers: 'Cuisine', famille: 'Petit-déjeuner', sousFamille: 'Grille-pain' },
    { univers: 'Cuisine', famille: 'Petit-déjeuner', sousFamille: 'Bouilloires' },
    { univers: 'Cuisine', famille: 'Préparation culinaire', sousFamille: 'Robots multifonctions' },
    { univers: 'Cuisine', famille: 'Préparation culinaire', sousFamille: 'Blenders' },
    { univers: 'Cuisine', famille: 'Préparation culinaire', sousFamille: 'Batteurs & mixeurs' },
    { univers: 'Cuisine', famille: 'Cuisson conviviale', sousFamille: 'Raclettes & fondues' },
    { univers: 'Cuisine', famille: 'Cuisson conviviale', sousFamille: 'Plancha' },
    { univers: 'Cuisine', famille: 'Cuisson conviviale', sousFamille: 'Multicuiseurs' }
  ];

  constructor() {
    this.dataSubject.next(this.rawData);
  }

  getAllData(): ProductData[] {
    return this.rawData;
  }

  getUnivers(): string[] {
    return [...new Set(this.rawData.map(item => item.univers))];
  }

  getFamillesByUnivers(univers: string): string[] {
    return [...new Set(this.rawData
      .filter(item => item.univers === univers)
      .map(item => item.famille))];
  }

  getSousFamillesByFamille(univers: string, famille: string): string[] {
    return [...new Set(this.rawData
      .filter(item => item.univers === univers && item.famille === famille)
      .map(item => item.sousFamille))];
  }

  filterData(filters: { univers?: string, famille?: string, search?: string }): ProductData[] {
    let filteredData = this.rawData;

    if (filters.univers) {
      filteredData = filteredData.filter(item => item.univers === filters.univers);
    }

    if (filters.famille) {
      filteredData = filteredData.filter(item => item.famille === filters.famille);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredData = filteredData.filter(item =>
        item.univers.toLowerCase().includes(searchTerm) ||
        item.famille.toLowerCase().includes(searchTerm) ||
        item.sousFamille.toLowerCase().includes(searchTerm)
      );
    }

    this.dataSubject.next(filteredData);
    return filteredData;
  }

  getStats() {
    const stats = {
      totalItems: this.rawData.length,
      universCount: this.getUnivers().length,
      familleCount: [...new Set(this.rawData.map(item => item.famille))].length,
      sousFamilleCount: [...new Set(this.rawData.map(item => item.sousFamille))].length
    };
    return stats;
  }
}