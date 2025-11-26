import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material-module';
import { TrunkHierarchyNode, TreeNodeAction, TreeViewConfig } from '../../interfaces/trunk-hierarchy.interface';

@Component({
  selector: 'app-tree-view',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.scss']
})
export class TreeViewComponent implements OnInit {
  @Input() nodes: TrunkHierarchyNode[] = [];
  @Input() config: TreeViewConfig = {
    showIcons: true,
    showArticleCount: true,
    allowMultipleSelection: false,
    expandOnClick: true
  };
  @Input() selectedNodeIds: string[] = [];
  @Input() getSelectedCountForNode?: (node: TrunkHierarchyNode) => number; // Nouvelle propriété pour recevoir la fonction de comptage
  
  @Output() nodeAction = new EventEmitter<TreeNodeAction>();
  @Output() nodeSelected = new EventEmitter<TrunkHierarchyNode>();

  ngOnInit(): void {
    // Initialiser l'état d'expansion par défaut
    this.initializeExpandedState();
  }

  private initializeExpandedState(): void {
    this.nodes.forEach(node => {
      if (node.type === 'trunk' || node.type === 'niveau') {
        node.expanded = true;
      }
    });
  }

  toggleNode(node: TrunkHierarchyNode): void {
    if (node.children && node.children.length > 0) {
      node.expanded = !node.expanded;
      this.nodeAction.emit({
        nodeId: node.id,
        action: node.expanded ? 'expand' : 'collapse',
        node: node
      });
    }
  }

  selectNode(node: TrunkHierarchyNode): void {
    if (!this.config.allowMultipleSelection) {
      // Désélectionner tous les autres nœuds
      this.clearAllSelections(this.nodes);
    }
    
    node.isSelected = !node.isSelected;
    
    this.nodeAction.emit({
      nodeId: node.id,
      action: node.isSelected ? 'select' : 'deselect',
      node: node
    });
    
    if (node.isSelected) {
      this.nodeSelected.emit(node);
    }
  }

  private clearAllSelections(nodes: TrunkHierarchyNode[]): void {
    nodes.forEach(node => {
      node.isSelected = false;
      if (node.children) {
        this.clearAllSelections(node.children);
      }
    });
  }

  onNodeClick(node: TrunkHierarchyNode): void {
    if (this.config.expandOnClick && node.children && node.children.length > 0) {
      this.toggleNode(node);
    }
    this.selectNode(node);
  }

  getNodeIcon(node: TrunkHierarchyNode): string {
    switch (node.type) {
      case 'trunk':
        return 'inventory';
      case 'niveau':
        return 'layers';
      case 'rayon':
        return 'store';
      case 'famille':
        return 'category';
      case 'sous-famille':
        return 'label';
      default:
        return 'folder';
    }
  }

  getExpandIcon(node: TrunkHierarchyNode): string {
    if (!node.children || node.children.length === 0) {
      return '';
    }
    return node.expanded ? 'expand_more' : 'chevron_right';
  }

  getNodeClass(node: TrunkHierarchyNode): string {
    const classes = ['tree-node', `tree-node-${node.type}`, `tree-node-level-${node.level}`];
    
    if (node.isSelected) {
      classes.push('tree-node-selected');
    }
    
    if (node.children && node.children.length > 0) {
      classes.push('tree-node-expandable');
    }
    
    return classes.join(' ');
  }

  getLevelNumber(node: TrunkHierarchyNode): number | null {
    if (node.type !== 'niveau') return null;
    const byId = /^niveau-(\d+)/i.exec(node.id);
    if (byId) return parseInt(byId[1], 10);
    const byName = /Niveau\s+(\d+)/i.exec(node.name);
    return byName ? parseInt(byName[1], 10) : null;
  }

  getIndentStyle(level: number): { [key: string]: string } {
    return {
      'padding-left': `${level * 20}px`
    };
  }

  hasChildren(node: TrunkHierarchyNode): boolean {
    return !!(node.children && node.children.length > 0);
  }

  isNodeVisible(node: TrunkHierarchyNode, parentNode?: TrunkHierarchyNode): boolean {
    if (!parentNode) {
      return true;
    }
    return parentNode.expanded === true;
  }
}
