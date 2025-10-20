import { Component, OnInit, ViewChild, ElementRef, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// Material imports
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';

// Services
import { CategoryService, HierarchicalCategory } from '../../shared/services/category.service';

// Composition interfaces
import { CompositionItem, ArticleSearchResult, CompositionFormData } from '../../shared/models/composition.interface';

// Legacy interfaces for backward compatibility
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



interface MultilingualText {
  fr: string;
  en: string;
  es?: string;
  de?: string;
}

interface Language {
  code: string;
  name: string;
  flag: string;
  required: boolean;
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
    MatTooltipModule,
    MatTabsModule,
    MatSlideToggleModule,
    MatDividerModule
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
  
  // Multi-level category system
  categoryLevels: { [level: number]: HierarchicalCategory[] } = {};
  selectedCategoryPath: { [level: number]: string } = {};
  categoryPath: string[] = [];
  finalCategoryId: string = '';
  
  // Legacy data for backward compatibility (will be removed)
  categories: Category[] = [];
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



  languages: Language[] = [
    { code: 'fr', name: 'Français', flag: '🇫🇷', required: true },
    { code: 'en', name: 'English', flag: '🇬🇧', required: false },
    { code: 'es', name: 'Español', flag: '🇪🇸', required: false },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪', required: false }
  ];

  selectedLanguage: string = 'fr'; // Langue active par défaut
  translationsEnabled: boolean = false; // Toggle pour activer/désactiver les traductions

  getSelectedLanguage(): Language {
    return this.languages.find(lang => lang.code === this.selectedLanguage) || this.languages[0];
  }

  // Composition properties
  isCompositionEnabled: boolean = false;
  articleSearchQuery: string = '';
  searchResults: ArticleSearchResult[] = [];
  isSearching: boolean = false;
  compositionItems: CompositionItem[] = [];

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadCategories();
    // Simulation d'un exemple pré-rempli pour la démo
    setTimeout(() => {
      this.aiInput = "T-shirt manches courtes bleu marine taille M, 100% coton bio, marque EcoWear";
    }, 1000);
  }

  private initForm(): void {
    this.articleForm = this.fb.group({
      // Informations générales
      reference: [''],
      ean: this.fb.array([this.fb.control('')]),
      shortDescription: this.fb.group({
        fr: ['', Validators.required],
        en: [''],
        es: [''],
        de: ['']
      }),
      longDescription: this.fb.group({
        fr: ['', Validators.required],
        en: [''],
        es: [''],
        de: ['']
      }),
      
      // Multi-level Classification
      categoryLevel1: [''],
      categoryLevel2: [''],
      categoryLevel3: [''],
      categoryLevel4: [''],
      categoryLevel5: [''],
      finalCategory: ['', Validators.required], // The actual category ID to be saved
      
      // Legacy fields for backward compatibility
      category: [''],
      subcategory: [''],
      
      brand: [''],
      collection: [''],
      

      
      // Composition
      isComposed: [false],
      compositionItems: [[]]
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

    // Analyse du type de produit
    if (input.includes('t-shirt')) {
      parsedData.category = 'clothing';
      parsedData.subcategory = 'tshirt';
    } else if (input.includes('chemise')) {
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



    // Description automatique multilingue
    if (parsedData.name) {
      parsedData.shortDescription = {
        fr: `${parsedData.name} de qualité supérieure`,
        en: `High-quality ${parsedData.name}`,
        es: `${parsedData.name} de alta calidad`,
        de: `Hochwertiges ${parsedData.name}`
      };
      parsedData.longDescription = {
        fr: `${parsedData.name} confectionné avec soin, parfait pour un style décontracté et moderne.`,
        en: `Carefully crafted ${parsedData.name}, perfect for a casual and modern style.`,
        es: `${parsedData.name} confeccionado con cuidado, perfecto para un estilo casual y moderno.`,
        de: `Sorgfältig gefertigtes ${parsedData.name}, perfekt für einen lässigen und modernen Stil.`
      };
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
    this.selectedImage = null;
    this.aiProcessed = false;
    this.selectedSubcategories = [];
    
    // Reset des valeurs multilingues
    this.articleForm.patchValue({
      shortDescription: {
        fr: '',
        en: '',
        es: '',
        de: ''
      },
      longDescription: {
        fr: '',
        en: '',
        es: '',
        de: ''
      }
    });
    
    // Reset des autres champs
    this.articleForm.patchValue({
      reference: '',
      category: '',
      subcategory: '',
      brand: '',
      collection: '',
      color: '',
      size: '',
      material: '',
      weight: null,
      supplier: '',
      supplierReference: '',
      packaging: '',
      packagingQuantity: null
    });
    
    // Reset du FormArray des codes EAN
    while (this.eanArray.length > 1) {
      this.eanArray.removeAt(1);
    }
    this.eanArray.at(0)?.setValue('');
  }

  // ===== CATEGORY MANAGEMENT =====
  private loadCategories(): void {
    this.categoryService.getCategories().subscribe(categories => {
      this.categoryLevels[1] = categories;
    });
  }

  onCategoryLevelChange(level: number, categoryId: string): void {
    // Update selected path
    this.selectedCategoryPath[level] = categoryId;
    
    // Clear subsequent levels
    for (let i = level + 1; i <= 5; i++) {
      delete this.selectedCategoryPath[i];
      delete this.categoryLevels[i];
      this.articleForm.patchValue({ [`categoryLevel${i}`]: '' });
    }
    
    // Load children for next level if they exist
    if (level < 5) {
      const children = this.categoryService.getCategoriesByLevel(level + 1, categoryId);
      if (children.length > 0) {
        this.categoryLevels[level + 1] = children;
      }
    }
    
    // Update category path and final category
    this.updateCategoryPath();
    this.updateFinalCategory();
  }

  private updateCategoryPath(): void {
    const pathIds = Object.keys(this.selectedCategoryPath)
      .map(level => parseInt(level))
      .sort((a, b) => a - b)
      .map(level => this.selectedCategoryPath[level]);
    
    this.categoryPath = [];
    pathIds.forEach(id => {
      const category = this.categoryService.findCategoryById(id);
      if (category) {
        this.categoryPath.push(category.name);
      }
    });
  }

  private updateFinalCategory(): void {
    // Find the deepest selected category
    const levels = Object.keys(this.selectedCategoryPath)
      .map(level => parseInt(level))
      .sort((a, b) => b - a); // Sort descending
    
    if (levels.length > 0) {
      const deepestLevel = levels[0];
      const categoryId = this.selectedCategoryPath[deepestLevel];
      
      // Check if this category is selectable
      if (this.categoryService.isCategorySelectable(categoryId)) {
        this.finalCategoryId = categoryId;
        this.articleForm.patchValue({ finalCategory: categoryId });
        
        // Update legacy category field for backward compatibility
        this.articleForm.patchValue({ category: categoryId });
      } else {
        this.finalCategoryId = '';
        this.articleForm.patchValue({ finalCategory: '' });
        this.articleForm.patchValue({ category: '' });
      }
    }
  }

  getCategoryDisplayPath(): string {
    return this.categoryPath.join(' > ');
  }

  isCategorySelectionComplete(): boolean {
    return this.finalCategoryId !== '' && this.categoryService.isCategorySelectable(this.finalCategoryId);
  }

  // Custom validator for category selection
  private categorySelectionValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const finalCategoryId = this.finalCategoryId;
      if (!finalCategoryId) {
        return { categoryRequired: true };
      }
      
      // Check if the selected category is actually selectable (leaf node or explicitly marked as selectable)
      const category = this.categoryService.findCategoryById(finalCategoryId);
      if (!category || !this.categoryService.isCategorySelectable(finalCategoryId)) {
        return { categoryNotSelectable: true };
      }
      
      return null;
    };
  }

  // Validate category selection when form is submitted
  validateCategorySelection(): boolean {
    const finalCategoryControl = this.articleForm.get('finalCategory');
    if (finalCategoryControl) {
      const validationResult = this.categorySelectionValidator()(finalCategoryControl);
      if (validationResult) {
        finalCategoryControl.setErrors(validationResult);
        return false;
      }
    }
    return true;
  }

  // ===== LEGACY METHODS FOR BACKWARD COMPATIBILITY =====
  onCategoryChange(event: any): void {
    // This method is kept for backward compatibility but is no longer used
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

  // ===== GESTION CODES EAN MULTIPLES =====
  get eanArray(): FormArray {
    return this.articleForm.get('ean') as FormArray;
  }

  addEanCode(): void {
    this.eanArray.push(this.fb.control(''));
  }

  removeEanCode(index: number): void {
    if (this.eanArray.length > 1) {
      this.eanArray.removeAt(index);
    }
  }

  validateEanCode(eanCode: string): boolean {
    // Validation basique pour les codes EAN (8, 13 ou 14 chiffres)
    const eanRegex = /^\d{8}$|^\d{13}$|^\d{14}$/;
    return eanRegex.test(eanCode);
  }

  getEanCodes(): string[] {
    return this.eanArray.value.filter((code: string) => code.trim() !== '');
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
    // Validate category selection first
    if (!this.validateCategorySelection()) {
      alert('Veuillez sélectionner une catégorie valide.');
      return;
    }
    
    // Update form with composition data before submission
    this.updateFormWithCompositionData();
    
    if (this.articleForm.valid) {
      const formData = this.articleForm.value;
      console.log('Article à créer:', formData);
      console.log('Image sélectionnée:', this.selectedImage);
      console.log('Composition:', this.getCompositionFormData());
      
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

  // ===== COMPOSITION METHODS =====
  
  onCompositionToggle(event: any): void {
    this.isCompositionEnabled = event.checked;
    
    // Update form control
    this.articleForm.patchValue({ isComposed: this.isCompositionEnabled });
    
    if (!this.isCompositionEnabled) {
      // Clear composition data when disabled
      this.compositionItems = [];
      this.articleSearchQuery = '';
      this.searchResults = [];
      this.articleForm.patchValue({ compositionItems: [] });
    }
  }

  private updateFormWithCompositionData(): void {
    this.articleForm.patchValue({
      isComposed: this.isCompositionEnabled,
      compositionItems: this.compositionItems
    });
  }

  onArticleSearch(): void {
    if (!this.articleSearchQuery.trim()) {
      this.searchResults = [];
      return;
    }

    this.isSearching = true;
    
    // Simulate API call with timeout
    setTimeout(() => {
      this.searchResults = this.mockArticleSearch(this.articleSearchQuery);
      this.isSearching = false;
    }, 800);
  }

  private mockArticleSearch(query: string): ArticleSearchResult[] {
    // Mock data for demonstration
    const mockArticles: ArticleSearchResult[] = [
      {
        id: 'art001',
        reference: 'REF-001',
        name: 'T-shirt Coton Bio',
        price: 29.99,
        imageUrl: 'assets/images/tshirt-sample.jpg',
        category: 'Vêtements',
        brand: 'EcoWear'
      },
      {
        id: 'art002',
        reference: 'REF-002',
        name: 'Jean Slim Stretch',
        price: 79.99,
        imageUrl: 'assets/images/jean-sample.jpg',
        category: 'Vêtements',
        brand: 'Urban Style'
      },
      {
        id: 'art003',
        reference: 'REF-003',
        name: 'Sneakers Cuir',
        price: 129.99,
        imageUrl: 'assets/images/sneakers-sample.jpg',
        category: 'Chaussures',
        brand: 'Modern Chic'
      },
      {
        id: 'art004',
        reference: 'REF-004',
        name: 'Sac à Dos Toile',
        price: 59.99,
        imageUrl: 'assets/images/backpack-sample.jpg',
        category: 'Accessoires',
        brand: 'Nature Fashion'
      },
      {
        id: 'art005',
        reference: 'REF-005',
        name: 'Montre Connectée',
        price: 199.99,
        imageUrl: 'assets/images/watch-sample.jpg',
        category: 'Électronique',
        brand: 'Tech Style'
      }
    ];

    // Filter articles based on search query
    return mockArticles.filter(article => 
      article.name.toLowerCase().includes(query.toLowerCase()) ||
      article.reference.toLowerCase().includes(query.toLowerCase()) ||
      (article.brand && article.brand.toLowerCase().includes(query.toLowerCase()))
    );
  }

  addToComposition(article: ArticleSearchResult): void {
    // Check if article is already in composition
    const existingItem = this.compositionItems.find(item => item.articleId === article.id);
    
    if (existingItem) {
      // Increase quantity if already exists
      existingItem.quantity += 1;
    } else {
      // Add new item to composition
      const newItem: CompositionItem = {
        articleId: article.id,
        articleReference: article.reference,
        articleName: article.name,
        articlePrice: article.price,
        articleImageUrl: article.imageUrl,
        quantity: 1
      };
      this.compositionItems.push(newItem);
    }

    // Clear search after adding
    this.articleSearchQuery = '';
    this.searchResults = [];
  }

  updateCompositionQuantity(item: CompositionItem, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromComposition(item);
    } else {
      item.quantity = quantity;
    }
  }

  removeFromComposition(item: CompositionItem): void {
    const index = this.compositionItems.findIndex(i => i.articleId === item.articleId);
    if (index > -1) {
      this.compositionItems.splice(index, 1);
    }
  }

  getTotalCompositionItems(): number {
    return this.compositionItems.reduce((total, item) => total + item.quantity, 0);
  }

  getCompositionFormData(): CompositionFormData {
    return {
      isComposed: this.isCompositionEnabled,
      items: this.compositionItems
    };
  }
}