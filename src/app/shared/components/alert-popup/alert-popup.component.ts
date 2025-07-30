import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../shared/material-module';

export interface AlertData {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  showDontShowAgain?: boolean;
}

@Component({
  selector: 'app-alert-popup',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule],
  templateUrl: './alert-popup.component.html',
  styleUrls: ['./alert-popup.component.scss']
})
export class AlertPopupComponent {
  @Input() data: AlertData = {
    title: '',
    message: '',
    type: 'info'
  };
  
  @Output() close = new EventEmitter<void>();
  @Output() dontShowAgain = new EventEmitter<void>();
  
  dontShowAgainChecked = false;

  onClose(): void {
    this.close.emit();
  }

  onDontShowAgain(): void {
    if (this.dontShowAgainChecked) {
      this.dontShowAgain.emit();
    }
    this.close.emit();
  }

  getIcon(): string {
    switch (this.data.type) {
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'success': return 'check_circle';
      default: return 'info';
    }
  }

  getIconColor(): string {
    switch (this.data.type) {
      case 'warning': return '#ff9800';
      case 'error': return '#f44336';
      case 'success': return '#4caf50';
      default: return '#2196f3';
    }
  }
}