import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MaterialModule } from '../../shared/material-module';

@Component({
  selector: 'app-create-attribute',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './create-attribute.component.html',
  styleUrls: ['./create-attribute.component.scss']
})
export class CreateAttributeComponent implements OnInit {
  @Output() goBack = new EventEmitter<void>();
  @Input() isFocusMode: boolean = false;

  attributeForm!: FormGroup;
  enumValues: string[] = [];

  types: string[] = ['int', 'float', 'decimal', 'string'];
  typesAttribut: string[] = ['ARTICLE', 'SITE'];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.attributeForm = this.fb.group({
      typeAttribut: ['', [Validators.required]],
      libelle: ['', [Validators.required, Validators.maxLength(100)]],
      type: ['', Validators.required],
      declinable: [false],
      enum: [false],
      optionnel: [false],
      valeursMultiples: [false],
      enumInput: ['']
    });
  }

  addEnumValue(): void {
    const raw = this.attributeForm.get('enumInput')?.value ?? '';
    const valueStr = (typeof raw === 'string' ? raw : String(raw)).trim();
    if (!valueStr) {
      return;
    }
    const valueNum = Number(valueStr);
    if (!isFinite(valueNum)) {
      return;
    }
    this.enumValues.push(valueStr);
    this.attributeForm.get('enumInput')?.reset('');
  }

  onSubmit(): void {
    if (this.attributeForm.invalid) {
      this.attributeForm.markAllAsTouched();
      return;
    }
    const value = this.attributeForm.value;
    console.log('Créer attribut:', value);
    // TODO: appeler service de création, puis revenir au dashboard
    this.goBack.emit();
  }

  goBackToDashboard(): void {
    this.goBack.emit();
  }
}