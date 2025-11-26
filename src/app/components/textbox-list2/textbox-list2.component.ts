import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'textbox_list2',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './textbox-list2.component.html',
  styleUrls: ['./textbox-list2.component.scss']
})
export class TextboxList2Component {
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  onInput(val: string): void {
    this.value = val;
    this.valueChange.emit(this.value);
  }
}
