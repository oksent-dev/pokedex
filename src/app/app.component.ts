import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { PokemonListComponent } from './components/pokemon-list/pokemon-list.component';
import { FilterTypeComponent } from './components/filter-type/filter-type.component';
import { PokemonDetailComponent } from './components/pokemon-detail/pokemon-detail.component';
import { Pokemon } from './models/pokemon.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    SearchBarComponent,
    PokemonListComponent,
    FilterTypeComponent,
    PokemonDetailComponent,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <main class="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100">
      <div class="container mx-auto px-4 py-8">
        <app-header />

        @if (selectedPokemon()) {
        <div class="mb-6">
          <div class="flex justify-center">
            <button mat-stroked-button (click)="goBackToList()" class="mb-4 ">
              <mat-icon>arrow_back</mat-icon>
              Back to Pokédex
            </button>
          </div>
          <app-pokemon-detail [pokemonData]="selectedPokemon()!" />
        </div>
        } @else {
        <div class="w-full mx-auto">
          <div class="max-w-md mx-auto">
            <app-search-bar (search)="onSearchChange($event)" />
          </div>
          <app-filter-type
            [selectedTypes]="selectedTypes()"
            (onTypesSelect)="onTypeFilterChange($event)"
          />
          <app-pokemon-list
            [selectedTypes]="selectedTypes()"
            [searchQuery]="searchQuery()"
            (onPokemonSelect)="onPokemonSelect($event)"
          />
        </div>
        }

        <router-outlet />
      </div>
    </main>
  `,
  styles: [],
})
export class AppComponent {
  selectedTypes = signal<string[]>([]);
  searchQuery = signal<string>('');
  selectedPokemon = signal<Pokemon | null>(null);

  onTypeFilterChange(types: string[]): void {
    this.selectedTypes.set(types);
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
  }

  onPokemonSelect(pokemon: Pokemon): void {
    this.selectedPokemon.set(pokemon);
  }

  goBackToList(): void {
    this.selectedPokemon.set(null);
  }
}
