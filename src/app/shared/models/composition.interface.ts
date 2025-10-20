export interface CompositionItem {
  articleId: string;
  articleReference: string;
  articleName: string;
  articlePrice: number;
  articleImageUrl?: string;
  quantity: number;
}

export interface ArticleComposition {
  id?: string;
  parentArticleId: string;
  compositionItems: CompositionItem[];
  totalItems: number;
  totalValue?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ArticleSearchResult {
  id: string;
  reference: string;
  name: string;
  price: number;
  imageUrl?: string;
  category: string;
  brand?: string;
}

export interface CompositionFormData {
  isComposed: boolean;
  items: CompositionItem[];
  totalItems?: number;
  totalValue?: number;
}