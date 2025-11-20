import { Component, TemplateRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-referencement-article',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, MatSnackBarModule],
  templateUrl: './referencement-article.component.html',
  styleUrls: ['./referencement-article.component.scss']
})
export class ReferencementArticleComponent implements OnInit {
  @ViewChild('confirmCreateDialog') confirmCreateDialog!: TemplateRef<any>;
  newItem: {
    typeArticle: string;
    uniteStock: string;
    uniteFacturation: string;
    natureArticle: string;
    designation?: string;
    delaiConsommation?: number;
    structureMarchandise?: string;
    codeStatistique?: string;
    codeModele?: string;
    autresCodes?: string;
    caracteristiquesTechniques?: string;
    attributs?: string;
    attributeValue?: string;
    variantesVente?: string;
    ean13?: string;
    plu?: string;
    ean7?: string;
    codePropre?: string;
    packsKits?: string;
    venteAssistee?: string;
    variantesLogistiques?: string;
    uvc?: string;
    spcb?: string;
    pcb?: string;
    couche?: string;
    palette?: string;
    planPalettisation?: string;
    ulHomogenes?: string;
    ulComplexes?: string;
    recetteFabrication?: string;
    emballages?: string;
    fournisseur?: string;
  } = {
    typeArticle: '',
    uniteStock: '',
    uniteFacturation: '',
    natureArticle: '',
    designation: '',
    delaiConsommation: undefined,
    structureMarchandise: '',
    codeStatistique: '',
    codeModele: '',
    autresCodes: '',
    caracteristiquesTechniques: '',
    attributs: '',
    attributeValue: '',
    variantesVente: '',
    ean13: '',
    plu: '',
    ean7: '',
    codePropre: '',
    packsKits: '',
    venteAssistee: '',
    variantesLogistiques: '',
    uvc: '',
    spcb: '',
    pcb: '',
    couche: '',
    palette: '',
    planPalettisation: '',
    ulHomogenes: '',
    ulComplexes: '',
    recetteFabrication: '',
    emballages: '',
    fournisseur: ''
  };

  existingAttributes: string[] = ['Couleur', 'Taille', 'Matière', 'Marque', 'Saison'];
  attributeValues: Record<string, string[]> = {
    'Couleur': ['Rouge', 'Bleu', 'Noir', 'Blanc', 'Vert', 'Jaune', 'Gris'],
    'Taille': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    'Matière': ['Coton', 'Laine', 'Polyester', 'Cuir', 'Lin'],
    'Marque': ['Generic', 'Premium', 'Eco'],
    'Saison': ['PE', 'AH']
  };
  attributeTypes: Record<string, string> = {
    'Couleur': 'text',
    'Taille': 'text',
    'Matière': 'text',
    'Marque': 'text',
    'Saison': 'text'
  };

  get currentAttributeOptions(): string[] {
    return this.attributeValues[this.selectedAttribute] || [];
  }
  selectedAttribute: string = '';
  showNewAttribute: boolean = false;
  newAttributeName: string = '';
  newAttributeType: string = 'text';
  attributeValue: string = '';
  attributeEntries: { attribute: string; value: string }[] = [{ attribute: '', value: '' }];
  showFabrication: boolean = true;
  showEmballage: boolean = true;
  showAttributs: boolean = true;
  createdArticleSnapshot: any | null = null;
  showErrors: boolean = false;

  supplierOptions: { value: string; label: string; address: string; phone: string; email: string; fiscalCode: string }[] = [
    { value: 'SUP-001', label: 'Fournisseur ABC', address: '12 rue des Fleurs, 69000 Lyon', phone: '+33 4 72 00 00 00', email: 'contact@abc.fr', fiscalCode: 'FR12ABC345' },
    { value: 'SUP-002', label: 'Fournisseur DEF', address: '5 avenue de la République, 75011 Paris', phone: '+33 1 44 00 00 00', email: 'service@def.fr', fiscalCode: 'FR98DEF765' },
    { value: 'SUP-003', label: 'Fournisseur GHI', address: '23 boulevard Maritime, 13008 Marseille', phone: '+33 4 91 00 00 00', email: 'support@ghi.fr', fiscalCode: 'FR45GHI123' }
  ];

  get selectedSupplierDetail() {
    return this.supplierOptions.find(s => s.value === this.newItem.fournisseur) || null;
  }

  get hasAttributeValue(): boolean {
    return this.attributeEntries.some(e => String(e.value || '').trim().length > 0);
  }

  constructor(private snackBar: MatSnackBar, private dialog: MatDialog, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const d = this.route.snapshot.queryParamMap.get('designation') || '';
    if (d) this.newItem.designation = d;
  }

  saveArticle(): void {
    const required = [
      this.newItem.typeArticle,
      this.newItem.uniteStock,
      this.newItem.uniteFacturation,
      this.newItem.natureArticle,
      this.newItem.designation
    ];
    if (required.some(v => !v)) {
      this.showErrors = true;
      this.snackBar.open('Veuillez renseigner les champs obligatoires de l’article', 'Fermer', { duration: 3000 });
      return;
    }
    const invalidAttr = this.attributeEntries.some(e => e.attribute && !String(e.value || '').trim());
    if (invalidAttr) {
      this.showErrors = true;
      this.snackBar.open('Valeur d\'attribut requise', 'Fermer', { duration: 3000 });
      return;
    }
    this.newItem.attributs = this.attributeEntries[0]?.attribute || '';
    this.newItem.attributeValue = this.attributeEntries[0]?.value || '';
    const mapped = this.attributeEntries.filter(e => e.attribute).map(e => ({ name: e.attribute, value: e.value }));
    (this.newItem as any).attributes = mapped;
    this.createdArticleSnapshot = { ...this.newItem };
    this.dialog.open(this.confirmCreateDialog);
    this.showErrors = false;
    this.newItem = {
      typeArticle: '',
      uniteStock: '',
      uniteFacturation: '',
      natureArticle: '',
      delaiConsommation: undefined,
      structureMarchandise: '',
      codeStatistique: '',
      codeModele: '',
      autresCodes: '',
      caracteristiquesTechniques: '',
      attributs: '',
      attributeValue: '',
      variantesVente: '',
      ean13: '',
      plu: '',
      ean7: '',
      codePropre: '',
      packsKits: '',
      venteAssistee: '',
      variantesLogistiques: '',
      uvc: '',
      spcb: '',
      pcb: '',
      couche: '',
      palette: '',
      planPalettisation: '',
      ulHomogenes: '',
      ulComplexes: '',
      recetteFabrication: '',
      emballages: '',
      fournisseur: ''
    };
    this.selectedAttribute = '';
    this.attributeValue = '';
    this.attributeEntries = [{ attribute: '', value: '' }];
    this.showErrors = false;
  }

  addNewAttribute(): void {
    const name = (this.newAttributeName || '').trim();
    if (!name) {
      this.snackBar.open('Nom d\'attribut requis', 'Fermer', { duration: 3000 });
      return;
    }
    if (!this.existingAttributes.includes(name)) {
      this.existingAttributes.push(name);
    }
    this.attributeTypes[name] = this.newAttributeType || 'text';
    this.selectedAttribute = name;
    this.newItem.attributs = name;
    this.attributeValue = '';
    if (this.attributeEntries.length === 0) {
      this.attributeEntries.push({ attribute: name, value: '' });
    } else {
      this.attributeEntries[0] = { attribute: name, value: '' };
    }
    this.newAttributeName = '';
    this.newAttributeType = 'text';
    this.showNewAttribute = false;
    this.snackBar.open('Nouvel attribut ajouté', 'Fermer', { duration: 2000 });
  }

  addAttributeRow(): void {
    this.attributeEntries.push({ attribute: '', value: '' });
  }

  goCreateSupplier(): void {
    this.router.navigate(['/referencement'], { queryParams: { supplierOnly: 1 } });
  }
}
