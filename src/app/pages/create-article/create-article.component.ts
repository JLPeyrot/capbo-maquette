import { Component, OnInit, ViewChild, ElementRef, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// Imports Material individuels
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

interface Collection {
  id: string;
  name: string;
}

interface Color {
  id: string;
  name: string;
  hex: string;
}

interface Size {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

@Component({
  selector: 'app-create-article',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './create-article.component.html',
  styleUrls: ['./create-article.component.scss']
})
export class CreateArticleComponent implements OnInit {
  @Output() goBack = new EventEmitter<void>();
  @Input() isFocusMode: boolean = false; // NOUVEAU : Input pour savoir si on est en mode focus
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;
  
  articleForm!: FormGroup;
  
  // État de l'IA
  aiInput: string = '';
  isAiProcessing: boolean = false;
  aiProcessed: boolean = false;
  
  // Image
  selectedImage: string | null = null;
  isDragOver: boolean = false;
  
  // Données de référence (mock)
  categories: Category[] = [
    {
      id: 'clothing',
      name: 'Vêtements',
      subcategories: [
        { id: 'tshirt', name: 'T-shirts' },
        { id: 'shirt', name: 'Chemises' },
        { id: 'pants', name: 'Pantalons' },
        { id: 'dress', name: 'Robes' }
      ]
    },
    {
      id: 'accessories',
      name: 'Accessoires',
      subcategories: [
        { id: 'bag', name: 'Sacs' },
        { id: 'jewelry', name: 'Bijoux' },
        { id: 'belt', name: 'Ceintures' }
      ]
    },
    {
      id: 'shoes',
      name: 'Chaussures',
      subcategories: [
        { id: 'sneakers', name: 'Baskets' },
        { id: 'boots', name: 'Bottes' },
        { id: 'sandals', name: 'Sandales' }
      ]
    }
  ];

  selectedSubcategories: Subcategory[] = [];

  brands: Brand[] = [
    { id: 'ecowear', name: 'EcoWear' },
    { id: 'urbanstyle', name: 'Urban Style' },
    { id: 'naturefashion', name: 'Nature Fashion' },
    { id: 'modernchic', name: 'Modern Chic' },
    { id: 'casuallife', name: 'Casual Life' }
  ];

  collections: Collection[] = [
    { id: 'spring2025', name: 'Printemps 2025' },
    { id: 'summer2025', name: 'Été 2025' },
    { id: 'autumn2025', name: 'Automne 2025' },
    { id: 'winter2025', name: 'Hiver 2025' },
    { id: 'basics', name: 'Basiques' }
  ];

  colors: Color[] = [
    { id: 'white', name: 'Blanc', hex: '#FFFFFF' },
    { id: 'black', name: 'Noir', hex: '#000000' },
    { id: 'navy', name: 'Bleu marine', hex: '#1B263B' },
    { id: 'red', name: 'Rouge', hex: '#E63946' },
    { id: 'green', name: 'Vert', hex: '#2D6A4F' },
    { id: 'gray', name: 'Gris', hex: '#6C757D' },
    { id: 'beige', name: 'Beige', hex: '#F5F5DC' },
    { id: 'pink', name: 'Rose', hex: '#E91E63' }
  ];

  sizes: Size[] = [
    { id: 'xs', name: 'XS' },
    { id: 's', name: 'S' },
    { id: 'm', name: 'M' },
    { id: 'l', name: 'L' },
    { id: 'xl', name: 'XL' },
    { id: 'xxl', name: 'XXL' },
    { id: 'unique', name: 'Taille unique' }
  ];

  suppliers: Supplier[] = [
    { id: 'texco', name: 'TextileCo France' },
    { id: 'fashionsupply', name: 'Fashion Supply Europe' },
    { id: 'ecotex', name: 'EcoTex Industries' },
    { id: 'qualitex', name: 'Qualitex International' },
    { id: 'modernfab', name: 'Modern Fabric Ltd' }
  ];

  constructor(
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    // Simulation d'un exemple pré-rempli pour la démo
    setTimeout(() => {
      this.aiInput = "T-shirt manches courtes bleu marine taille M, 100% coton bio, marque EcoWear, référence fournisseur ECO-TS-001";
    }, 1000);
  }

  private initForm(): void {
    this.articleForm = this.fb.group({
      // Informations générales
      name: ['', Validators.required],
      reference: [''],
      ean: [''],
      shortDescription: [''],
      longDescription: [''],
      
      // Classification
      category: ['', Validators.required],
      subcategory: [''],
      brand: [''],
      collection: [''],
      
      // Caractéristiques physiques
      color: [''],
      size: [''],
      material: [''],
      weight: [''],
      
      // Fournisseur
      supplier: ['', Validators.required],
      supplierReference: [''],
      packaging: ['unit'],
      packagingQuantity: [1]
    });
  }

  // ===== GESTION IA =====
  processWithAI(): void {
    if (!this.aiInput.trim()) return;

    this.isAiProcessing = true;

    // Simulation du traitement IA (3 secondes)
    setTimeout(() => {
      this.simulateAiParsing();
      this.isAiProcessing = false;
      this.aiProcessed = true;
    }, 3000);
  }

  private simulateAiParsing(): void {
    const input = this.aiInput.toLowerCase();
    
    // Simulation de parsing intelligent
    const parsedData: any = {};

    // Analyse du nom/type de produit
    if (input.includes('t-shirt')) {
      parsedData.name = 'T-shirt manches courtes';
      parsedData.category = 'clothing';
      parsedData.subcategory = 'tshirt';
    } else if (input.includes('chemise')) {
      parsedData.name = 'Chemise';
      parsedData.category = 'clothing';
      parsedData.subcategory = 'shirt';
    }

    // Analyse des couleurs
    if (input.includes('bleu marine') || input.includes('navy')) {
      parsedData.color = 'navy';
    } else if (input.includes('blanc')) {
      parsedData.color = 'white';
    } else if (input.includes('noir')) {
      parsedData.color = 'black';
    } else if (input.includes('rouge')) {
      parsedData.color = 'red';
    }

    // Analyse des tailles
    if (input.includes('taille m') || input.includes(' m ')) {
      parsedData.size = 'm';
    } else if (input.includes('taille s') || input.includes(' s ')) {
      parsedData.size = 's';
    } else if (input.includes('taille l') || input.includes(' l ')) {
      parsedData.size = 'l';
    }

    // Analyse de la matière
    if (input.includes('coton bio')) {
      parsedData.material = '100% coton bio';
    } else if (input.includes('coton')) {
      parsedData.material = '100% coton';
    } else if (input.includes('polyester')) {
      parsedData.material = 'Polyester';
    }

    // Analyse de la marque
    if (input.includes('ecowear')) {
      parsedData.brand = 'ecowear';
    } else if (input.includes('urban')) {
      parsedData.brand = 'urbanstyle';
    }

    // Analyse fournisseur
    if (input.includes('texco') || input.includes('textile')) {
      parsedData.supplier = 'texco';
    } else if (input.includes('eco')) {
      parsedData.supplier = 'ecotex';
    }

    // Référence fournisseur
    const refMatch = input.match(/(?:ref|référence)[^\w]*([a-z0-9\-]+)/i);
    if (refMatch) {
      parsedData.supplierReference = refMatch[1].toUpperCase();
    }

    // Description automatique
    if (parsedData.name) {
      parsedData.shortDescription = `${parsedData.name} de qualité supérieure`;
      parsedData.longDescription = `${parsedData.name} confectionné avec soin, parfait pour un style décontracté et moderne.`;
    }

    // Application des données parsées au formulaire
    this.articleForm.patchValue(parsedData);

    // Mise à jour des sous-catégories si catégorie sélectionnée
    if (parsedData.category) {
      this.onCategoryChange({ value: parsedData.category });
      // Re-application de la sous-catégorie après mise à jour
      setTimeout(() => {
        if (parsedData.subcategory) {
          this.articleForm.patchValue({ subcategory: parsedData.subcategory });
        }
      }, 100);
    }

    // Génération automatique de référence
    if (!parsedData.reference) {
      this.generateReference();
    }
  }

  clearAiInput(): void {
    this.aiInput = '';
    this.aiProcessed = false;
  }

  resetForm(): void {
    this.articleForm.reset();
    this.selectedImage = null;
    this.aiProcessed = false;
    this.selectedSubcategories = [];
    this.initForm();
  }

  // ===== GESTION FORMULAIRE =====
  onCategoryChange(event: any): void {
    const categoryId = event.value;
    const category = this.categories.find(c => c.id === categoryId);
    this.selectedSubcategories = category ? category.subcategories : [];
    
    // Reset subcategory quand on change de catégorie
    this.articleForm.patchValue({ subcategory: '' });
  }

  generateReference(): void {
    const category = this.articleForm.get('category')?.value || 'ART';
    const brand = this.articleForm.get('brand')?.value || 'GEN';
    const timestamp = Date.now().toString().slice(-6);
    
    const reference = `${category.toUpperCase()}-${brand.toUpperCase()}-${timestamp}`;
    this.articleForm.patchValue({ reference });
  }

  // ===== GESTION IMAGE =====
  onImageSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.processImageFile(file);
    }
  }

  onImageDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        this.processImageFile(file);
      }
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  private processImageFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.selectedImage = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedImage = null;
  }

  // ===== MÉTHODES POUR L'UPLOAD D'IMAGE =====
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  // ===== ACTIONS =====
  onSubmit(): void {
    if (this.articleForm.valid) {
      const formData = this.articleForm.value;
      console.log('Article à créer:', formData);
      console.log('Image sélectionnée:', this.selectedImage);
      
      // Ici on ferait l'appel API
      // this.articleService.createArticle(formData, this.selectedImage);
      
      // Simulation de sauvegarde
      alert('Article créé avec succès !');
      this.goBack.emit();
    }
  }

  previewArticle(): void {
    const formData = this.articleForm.value;
    console.log('Aperçu article:', formData);
    
    // Ici on pourrait ouvrir une modal de prévisualisation
    alert('Fonctionnalité d\'aperçu à implémenter');
  }

  // MODIFIÉ : Méthode de retour mise à jour
  goBackToDashboard(): void {
    this.goBack.emit();
  }
}