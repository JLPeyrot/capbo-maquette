import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'textbox_list1',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './textbox-list1.component.html',
  styleUrls: ['./textbox-list1.component.scss']
})
export class TextboxList1Component {
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  onInput(val: string): void {
    this.value = val;
    this.valueChange.emit(this.value);
  }
}
