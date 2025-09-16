import {
  Component,
  output,
  signal,
  inject,
  input,
  effect,
  ElementRef,
  HostListener,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms'; // Needed for ngModel
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { PokemonService } from '../../services/pokemon.service';
import { PokemonListItem } from '../../models/pokemon.model';
import { Subject, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
} from 'rxjs/operators';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="relative">
      <mat-form-field class="w-full">
        <mat-label>Search Pokémon by name or ID...</mat-label>
        <input
          matInput
          type="text"
          [(ngModel)]="searchQuerySignal"
          (ngModelChange)="onSearchQueryChanged($event)"
          placeholder="Pikachu or 25"
        />
        @if (searchQuerySignal()) {
        <button
          matSuffix
          mat-icon-button
          aria-label="Clear"
          (click)="clearSearch()"
        >
          <mat-icon>close</mat-icon>
        </button>
        }
      </mat-form-field>
      @if (suggestions().length > 0) {
      <ul
        class="absolute z-20 w-full bg-white border border-gray-300 mt-[-8px] rounded-b-md shadow-lg max-h-60 overflow-y-auto"
      >
        @for (suggestion of suggestions(); track suggestion.name) {
        <li
          (click)="selectSuggestion(suggestion)"
          class="p-3 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center"
        >
          <span>{{ pokemonService.formatPokemonName(suggestion.name) }}</span>
          @if (getPokemonId(suggestion.url) !== null) {
          <span class="text-xs text-gray-500"
            >#{{ getPokemonId(suggestion.url) }}</span
          >
          }
        </li>
        }
      </ul>
      }
    </div>
  `,
  styles: [
    `
      .mat-form-field {
        margin-bottom: 0 !important;
      }
    `,
  ],
})
export class SearchBarComponent {
  search = output<string>();
  pokemonService = inject(PokemonService);
  // Reference to host element for outside-click detection
  private hostEl = inject(ElementRef<HTMLElement>);

  // New input to receive current query from parent
  query = input<string>('');

  searchQuerySignal = signal('');
  suggestions = signal<PokemonListItem[]>([]);

  private searchQuerySubject = new Subject<string>();

  constructor() {
    // Keep the input field in sync with the parent-provided query without emitting another search
    effect(() => {
      const parentQuery = this.query();
      if (parentQuery !== this.searchQuerySignal()) {
        this.searchQuerySignal.set(parentQuery ?? '');
      }
    });

    this.searchQuerySubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          this.search.emit(query);
          if (!query.trim() || query.length < 2) {
            this.suggestions.set([]);
            return of([]);
          }
          return this.pokemonService.getAutocompleteSuggestions(query).pipe(
            catchError((error) => {
              console.error('Error fetching suggestions:', error);
              this.suggestions.set([]);
              return of([]);
            })
          );
        })
      )
      .subscribe((newSuggestions) => {
        this.suggestions.set(newSuggestions);
      });
  }

  // Close suggestions on outside click
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (target && !this.hostEl.nativeElement.contains(target)) {
      if (this.suggestions().length) this.suggestions.set([]);
    }
  }

  onSearchQueryChanged(query: string): void {
    this.searchQuerySignal.set(query);
    this.searchQuerySubject.next(query);

    if (!query.trim()) {
      this.search.emit('');
      this.suggestions.set([]);
    }
  }

  selectSuggestion(suggestion: PokemonListItem): void {
    let queryToEmit = suggestion.name;
    const id = this.getPokemonId(suggestion.url);
    if (id !== null) {
      queryToEmit = id.toString();
    }

    this.searchQuerySignal.set(queryToEmit);
    this.suggestions.set([]);
    this.search.emit(queryToEmit);
  }

  clearSearch(): void {
    this.searchQuerySignal.set('');
    this.suggestions.set([]);
    this.search.emit('');
    this.searchQuerySubject.next('');
  }

  getPokemonId(url: string): number | null {
    try {
      if (!url || !url.includes('/pokemon/')) return null;
      return this.pokemonService.getPokemonId(url);
    } catch (e) {
      return null;
    }
  }
}
