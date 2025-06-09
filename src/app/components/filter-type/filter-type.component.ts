import { Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { POKEMON_TYPES } from '../../models/pokemon.model';

@Component({
  selector: 'app-filter-type',
  imports: [MatButtonModule, MatIconModule, NgClass],
  template: `
    <div class="w-full mb-6 max-w-screen-lg mx-auto">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-sm font-medium text-gray-700">Filter by Type:</span>

        <div class="flex flex-wrap gap-1">
          @for (type of selectedTypes(); track type) {
          <button
            class="ml-1 hover:scale-105 cursor-pointer duration-200 rounded-full p-0.5"
            (click)="removeType(type)"
            [attr.aria-label]="'Remove ' + POKEMON_TYPES[type].name + ' filter'"
          >
            <span
              class="items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
              [class]="POKEMON_TYPES[type].color"
            >
              {{ POKEMON_TYPES[type].name }}
            </span>
          </button>
          }
        </div>

        @if (selectedTypes().length > 0) {
        <button
          mat-stroked-button
          class="!h-6 !px-2 !text-xs"
          (click)="clearAllFilters()"
        >
          Clear All
        </button>
        }
      </div>

      <div class="flex flex-wrap gap-2">
        @for (typeEntry of pokemonTypes; track typeEntry[0]) {
        <button
          class="px-3 text-shadow-black text-shadow-md py-1 rounded-full text-sm font-medium text-white cursor-pointer transition-all duration-200 hover:scale-105"
          [class]="typeEntry[1].color"
          [ngClass]="{
            'ring-2 ring-gray-800 ring-offset-2 opacity-90': isTypeSelected(
              typeEntry[0]
            ),
            'hover:opacity-80': !isTypeSelected(typeEntry[0])
          }"
          (click)="toggleType(typeEntry[0])"
        >
          {{ typeEntry[1].name }}
        </button>
        }
      </div>
    </div>
  `,
  styles: ``,
})
export class FilterTypeComponent {
  selectedTypes = input<string[]>([]);
  onTypesSelect = output<string[]>();

  pokemonTypes = Object.entries(POKEMON_TYPES);
  POKEMON_TYPES = POKEMON_TYPES;

  isTypeSelected(type: string): boolean {
    return this.selectedTypes().includes(type);
  }

  toggleType(type: string): void {
    const currentTypes = [...this.selectedTypes()];
    const typeIndex = currentTypes.indexOf(type);

    if (typeIndex > -1) {
      currentTypes.splice(typeIndex, 1);
    } else {
      currentTypes.push(type);
    }

    this.onTypesSelect.emit(currentTypes);
  }

  removeType(type: string): void {
    const currentTypes = this.selectedTypes().filter((t) => t !== type);
    this.onTypesSelect.emit(currentTypes);
  }

  clearAllFilters(): void {
    this.onTypesSelect.emit([]);
  }
}
