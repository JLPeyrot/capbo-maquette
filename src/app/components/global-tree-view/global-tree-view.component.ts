import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material-module';
import { TreeViewComponent } from '../tree-view/tree-view.component';
import { TrunkHierarchyNode, TreeNodeAction, TreeViewConfig } from '../../interfaces/trunk-hierarchy.interface';

@Component({
  selector: 'app-global-tree-view',
  standalone: true,
  imports: [CommonModule, MaterialModule, TreeViewComponent],
  templateUrl: './global-tree-view.component.html'
})
export class GlobalTreeViewComponent {
  @Input() nodes: TrunkHierarchyNode[] = [];
  @Input() config: TreeViewConfig = {
    showIcons: true,
    showArticleCount: true,
    allowMultipleSelection: false,
    expandOnClick: true
  };
  @Input() getSelectedCountForNode?: (node: TrunkHierarchyNode) => number;

  @Output() nodeAction = new EventEmitter<TreeNodeAction>();

  selectedNodeIds: string[] = [];

  onAction(evt: TreeNodeAction): void {
    if (evt.action === 'select') {
      this.selectedNodeIds = [evt.nodeId];
    } else if (evt.action === 'deselect') {
      this.selectedNodeIds = [];
    }
    this.nodeAction.emit(evt);
  }
}
