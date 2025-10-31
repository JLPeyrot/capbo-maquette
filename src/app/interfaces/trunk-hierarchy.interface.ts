export interface TrunkHierarchyNode {
  id: string;
  name: string;
  type: 'trunk' | 'niveau' | 'rayon' | 'famille' | 'sous-famille' | 'department' | 'family' | 'sub-family';
  level: number;
  parentId?: string;
  expanded?: boolean;
  articlesCount?: number;
  children?: TrunkHierarchyNode[];
  isSelected?: boolean;
}

export interface TrunkHierarchy {
  trunk: TrunkHierarchyNode;
  totalArticles: number;
  lastUpdated: Date;
}

export interface TreeViewConfig {
  showIcons: boolean;
  showArticleCount: boolean;
  allowMultipleSelection: boolean;
  expandOnClick: boolean;
  expandOnSelect?: boolean;
  multiSelect?: boolean;
}

export interface TreeNodeAction {
  nodeId: string;
  action: 'expand' | 'collapse' | 'select' | 'deselect';
  node: TrunkHierarchyNode;
}