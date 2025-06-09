import {
  Component,
  inject,
  input,
  signal,
  effect,
  computed,
  output,
} from '@angular/core';
import { POKEMON_TYPES, Pokemon } from '../../models/pokemon.model';
import { MatCardModule } from '@angular/material/card';
import { PokemonService } from '../../services/pokemon.service';
import { NgOptimizedImage, NgClass } from '@angular/common';

@Component({
  selector: 'app-pokemon-card',
  imports: [MatCardModule, NgOptimizedImage, NgClass],
  template: `
    <mat-card
      class="hover:scale-105 transition-all duration-200 cursor-pointer"
      appearance="outlined"
      (click)="handleClick()"
    >
      <mat-card-header>
        @if (pokemon(); as poke) {
        <span class="text-2xl font-bold mx-auto">
          #{{ pokemonId().toString().padStart(3, '0') }}
        </span>
        } @else {
        <span class="text-2xl font-bold">
          #{{ pokemonId().toString().padStart(3, '0') }}
        </span>
        }
      </mat-card-header>
      <mat-card-content class="text-center">
        @if (loading()) {
        <p>Loading...</p>
        } @else if (error()) {
        <p class="text-red-500">{{ error() }}</p>
        } @else if (pokemon()) { @if (pokemon(); as poke) {
        <img
          [ngSrc]="poke.sprites.front_default"
          [alt]="poke.name"
          width="150"
          height="150"
          class="mx-auto mb-4"
        />
        <p class="text-lg font-medium">
          {{ pokemonService.formatPokemonName(poke.name) }}
        </p>
        <div class="flex flex-wrap gap-2 justify-center mt-2">
          @for (type of poke.types; track type.type.name) {
          <span
            class="px-2 py-1 rounded-full text-sm text-white text-shadow-black text-shadow-md"
            [class]="POKEMON_TYPES[type.type.name].color"
            [ngClass]="{
              'ring-2 ring-yellow-400': isTypeSelected(type.type.name)
            }"
          >
            {{ type.type.name }}
          </span>
          }
        </div>
        } }
      </mat-card-content>
    </mat-card>
  `,
  styles: ``,
})
export class PokemonCardComponent {
  url = input<string>();
  name = input<string>();
  selectedTypes = input<string[]>([]);
  onPokemonClick = output<Pokemon>();
  pokemonService = inject(PokemonService);
  POKEMON_TYPES = POKEMON_TYPES;
  pokemon = signal<Pokemon | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  pokemonId = computed(() => {
    const url = this.url();
    return url ? this.pokemonService.getPokemonId(url) : 0;
  });
  matchesSelectedTypes = computed(() => {
    const pokemon = this.pokemon();
    const selectedTypes = this.selectedTypes();
    if (!pokemon || selectedTypes.length === 0) {
      return true;
    }
    const pokemonTypes = pokemon.types.map((type) => type.type.name);
    return selectedTypes.every((selectedType) =>
      pokemonTypes.includes(selectedType)
    );
  });
  isTypeSelected(typeName: string): boolean {
    return this.selectedTypes().includes(typeName);
  }
  handleClick(): void {
    const pokemon = this.pokemon();
    if (pokemon) {
      this.onPokemonClick.emit(pokemon);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }
  constructor() {
    effect(async () => {
      const url = this.url();
      if (url) {
        await this.fetchPokemon(url);
      }
    });
  }
  private async fetchPokemon(url: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const pokemonData = await this.pokemonService.fetchPokemonByUrl(url);
      this.pokemon.set(pokemonData);
    } catch (err) {
      this.error.set(
        err instanceof Error ? err.message : 'Failed to fetch Pokemon'
      );
      this.pokemon.set(null);
    } finally {
      this.loading.set(false);
    }
  }
}
