import {
  Component,
  inject,
  signal,
  effect,
  input,
  computed,
  output,
} from '@angular/core';
import { PokemonService } from '../../services/pokemon.service';
import { PokemonCardComponent } from '../pokemon-card/pokemon-card.component';
import { PokemonListItem, Pokemon } from '../../models/pokemon.model';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-pokemon-list',
  imports: [PokemonCardComponent, MatPaginatorModule],
  template: `
    <div class="p-4">
      @if (loading() || isLoadingTotalCount() || isLoadingAllPokemon()) {
      <div class="text-center py-8">
        <p class="text-lg">
          @if (isLoadingTotalCount()) { Loading total Pokémon count... } @if
          (isLoadingAllPokemon()) { Preparing full Pokémon list for search... }
          @else { Loading Pokémon... }
        </p>
      </div>
      } @else if (error()) {
      <div class="text-center py-8">
        <p class="text-red-500">{{ error() }}</p>
      </div>
      } @else if (filteredPokemonList().length === 0 && (selectedRegion() ||
      selectedTypes().length > 0 || searchQuery() || selectedGeneration())) {
      <div class="text-center py-8">
        <p class="text-lg text-gray-600">
          No Pokémon found matching your criteria.
        </p>
        <p class="text-sm text-gray-500 mt-2">
          Try adjusting your filters or search terms.
        </p>
      </div>
      } @else {
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-7xl mx-auto"
      >
        @for (pokemon of filteredPokemonList(); track pokemon.name) {
        <app-pokemon-card
          [url]="pokemon.url"
          [name]="pokemon.name"
          [selectedTypes]="selectedTypes()"
          (onPokemonClick)="handlePokemonClick($event)"
        />
        }
      </div>
      <mat-paginator
        class="mt-8"
        [length]="totalPokemonForCurrentView()"
        [pageSize]="itemsPerPage()"
        [pageIndex]="currentPage()"
        [pageSizeOptions]="[10, 20, 60, 100, 200]"
        (page)="handlePageEvent($event)"
        aria-label="Select page of Pokémon"
        showFirstLastButtons
      >
      </mat-paginator>
      }
    </div>
  `,
  styles: ``,
})
export class PokemonListComponent {
  selectedRegion = input<string | null>(null);
  selectedGeneration = input<string | null>(null);
  selectedTypes = input<string[]>([]);
  searchQuery = input<string>('');
  onPokemonSelect = output<Pokemon>();

  pokemonService = inject(PokemonService);

  currentPage = signal(0);
  itemsPerPage = signal(60);
  totalPokemonFromApi = signal(0);
  isLoadingTotalCount = signal(false);
  isLoadingAllPokemon = signal(false);

  allPokemonMasterList = signal<PokemonListItem[]>([]);
  typeFilteredMasterList = signal<PokemonListItem[]>([]);
  generationFilteredMasterList = signal<PokemonListItem[]>([]);
  regionFilteredMasterList = signal<PokemonListItem[]>([]);

  loading = signal(false);
  error = signal<string | null>(null);

  totalPokemonForCurrentView = computed(() => {
    const region = this.selectedRegion();
    const generation = this.selectedGeneration();
    const types = this.selectedTypes();
    const searchTerm = this.searchQuery().toLowerCase().trim();
    if (region) {
      return this.getSearchedList(this.regionFilteredMasterList(), searchTerm)
        .length;
    } else if (generation) {
      return this.getSearchedList(
        this.generationFilteredMasterList(),
        searchTerm
      ).length;
    } else if (types.length > 0) {
      return this.getSearchedList(this.typeFilteredMasterList(), searchTerm)
        .length;
    } else {
      return this.getSearchedList(this.allPokemonMasterList(), searchTerm)
        .length;
    }
  });

  totalPages = computed(() => {
    const total = this.totalPokemonForCurrentView();
    const perPage = this.itemsPerPage();
    if (perPage === 0) return 0;
    if (total === 0) {
      if (
        this.totalPokemonFromApi() === 0 &&
        !this.searchQuery() &&
        !this.selectedRegion() &&
        !this.selectedGeneration() &&
        this.selectedTypes().length === 0
      ) {
        return 0;
      }
      return 0;
    }
    return Math.ceil(total / perPage);
  });

  filteredPokemonList = computed(() => {
    const region = this.selectedRegion();
    const generation = this.selectedGeneration();
    const types = this.selectedTypes();
    const searchTerm = this.searchQuery().toLowerCase().trim();
    const page = this.currentPage();
    const items = this.itemsPerPage();
    const startIndex = page * items;
    const endIndex = startIndex + items;
    let listToProcess: PokemonListItem[];
    if (region) {
      listToProcess = this.regionFilteredMasterList();
    } else if (generation) {
      listToProcess = this.generationFilteredMasterList();
    } else if (types.length > 0) {
      listToProcess = this.typeFilteredMasterList();
    } else {
      listToProcess = this.allPokemonMasterList();
    }
    const searchedList = this.getSearchedList(listToProcess, searchTerm);
    return searchedList.slice(startIndex, endIndex);
  });

  constructor() {
    this.initializePokemonData();
    effect(async () => {
      const region = this.selectedRegion();
      this.currentPage.set(0);
      if (region) {
        await this.loadPokemonByRegion(region);
      } else {
        if (this.selectedGeneration())
          await this.loadPokemonByGeneration(this.selectedGeneration()!);
        else if (this.selectedTypes().length > 0)
          await this.loadPokemonByTypes(this.selectedTypes());
      }
    });
    effect(async () => {
      const generation = this.selectedGeneration();
      if (!this.selectedRegion()) {
        if (generation) {
          await this.loadPokemonByGeneration(generation);
        } else {
          if (this.selectedTypes().length > 0)
            await this.loadPokemonByTypes(this.selectedTypes());
        }
      }
    });
    effect(async () => {
      const types = this.selectedTypes();
      if (!this.selectedRegion() && !this.selectedGeneration()) {
        this.currentPage.set(0);
        if (types.length > 0) {
          await this.loadPokemonByTypes(types);
        } else {
          this.typeFilteredMasterList.set([]);
        }
      }
    });
    effect(() => {
      const query = this.searchQuery().trim();
      if (
        query &&
        !this.selectedRegion() &&
        !this.selectedGeneration() &&
        !this.selectedTypes().length
      ) {
        this.currentPage.set(0);
      }
    });
    effect(() => {
      const page = this.currentPage();
      const items = this.itemsPerPage();
      const total = this.totalPokemonForCurrentView();
      const maxPage = Math.max(0, Math.ceil(total / items) - 1);
      if (page > maxPage) {
        this.currentPage.set(maxPage);
      }
    });
  }

  async initializePokemonData(): Promise<void> {
    this.isLoadingTotalCount.set(true);
    this.isLoadingAllPokemon.set(true);
    this.error.set(null);
    try {
      this.clearAllMasterLists();
      const [totalCount, allNames] = await Promise.all([
        this.pokemonService.fetchTotalPokemonCount(),
        this.pokemonService.fetchAllPokemonNames(),
      ]);
      this.totalPokemonFromApi.set(totalCount);
      this.allPokemonMasterList.set(allNames);
    } catch (err) {
      this.error.set(
        err instanceof Error ? err.message : 'Failed to initialize Pokémon data'
      );
      this.totalPokemonFromApi.set(0);
      this.allPokemonMasterList.set([]);
    } finally {
      this.isLoadingAllPokemon.set(false);
      this.isLoadingTotalCount.set(false);
      this.loading.set(false);
    }
  }

  private clearAllMasterLists(): void {
    this.regionFilteredMasterList.set([]);
    this.generationFilteredMasterList.set([]);
    this.typeFilteredMasterList.set([]);
  }

  private getSearchedList(
    list: PokemonListItem[],
    searchTerm: string
  ): PokemonListItem[] {
    if (!searchTerm) return list;
    return list.filter((pokemon) => {
      const name = pokemon.name.toLowerCase();
      const id =
        this.pokemonService.getPokemonId(pokemon.url)?.toString() ?? '';
      return name.includes(searchTerm) || (id && id.includes(searchTerm));
    });
  }

  private async loadPokemonByRegion(region: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.clearAllMasterLists();
    try {
      const pokemonFromRegion = await this.pokemonService.fetchPokemonByRegion(
        region
      );
      pokemonFromRegion.sort(
        (a, b) =>
          this.pokemonService.getPokemonId(a.url) -
          this.pokemonService.getPokemonId(b.url)
      );
      this.regionFilteredMasterList.set(pokemonFromRegion);
    } catch (err) {
      this.error.set(
        err instanceof Error
          ? err.message
          : `Failed to load Pokémon for region ${region}`
      );
      this.regionFilteredMasterList.set([]);
    } finally {
      this.loading.set(false);
      this.currentPage.set(0);
    }
  }

  private async loadPokemonByGeneration(generation: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.clearAllMasterLists();
    try {
      const pokemonFromGeneration =
        await this.pokemonService.fetchPokemonByGeneration(generation);
      pokemonFromGeneration.sort(
        (a, b) =>
          this.pokemonService.getPokemonId(a.url) -
          this.pokemonService.getPokemonId(b.url)
      );
      this.generationFilteredMasterList.set(pokemonFromGeneration);
    } catch (err) {
      this.error.set(
        err instanceof Error
          ? err.message
          : `Failed to load Pokémon for generation ${generation}`
      );
      this.generationFilteredMasterList.set([]);
    } finally {
      this.loading.set(false);
      this.currentPage.set(0);
    }
  }

  private async loadPokemonByTypes(types: string[]): Promise<void> {
    if (types.length === 0) {
      this.typeFilteredMasterList.set([]);
      if (
        !this.selectedRegion() &&
        !this.selectedGeneration() &&
        !this.searchQuery().trim()
      ) {
        this.currentPage.set(0);
      }
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.clearAllMasterLists();
    try {
      const typePromises = types.map((type) =>
        this.pokemonService.fetchPokemonByType(type)
      );
      const typeResponses = await Promise.all(typePromises);
      const pokemonSets = typeResponses.map(
        (response) =>
          new Set(response.pokemon.map((p: any) => p.pokemon.name as string))
      );
      let intersectionPokemonNames = pokemonSets[0] || new Set<string>();
      for (let i = 1; i < pokemonSets.length; i++) {
        intersectionPokemonNames = new Set(
          [...intersectionPokemonNames].filter((pokemonName) =>
            pokemonSets[i].has(pokemonName)
          )
        );
      }
      const finalFilteredList: PokemonListItem[] = [];
      const addedNames = new Set<string>();
      for (const name of intersectionPokemonNames) {
        if (addedNames.has(name as string)) continue;
        for (const res of typeResponses) {
          const foundPokemonEntry = res.pokemon.find(
            (p: any) => p.pokemon.name === name
          );
          if (foundPokemonEntry) {
            finalFilteredList.push({
              name: foundPokemonEntry.pokemon.name,
              url: foundPokemonEntry.pokemon.url,
            });
            addedNames.add(name as string);
            break;
          }
        }
      }
      finalFilteredList.sort(
        (a, b) =>
          this.pokemonService.getPokemonId(a.url) -
          this.pokemonService.getPokemonId(b.url)
      );
      this.typeFilteredMasterList.set(finalFilteredList);
    } catch (err) {
      this.error.set(
        err instanceof Error ? err.message : 'Failed to load Pokémon by types'
      );
      this.typeFilteredMasterList.set([]);
    } finally {
      this.loading.set(false);
      this.currentPage.set(0);
    }
  }

  handlePageEvent(event: PageEvent): void {
    this.loading.set(true);
    this.currentPage.set(event.pageIndex);
    this.itemsPerPage.set(event.pageSize);
    this.loading.set(false);
  }

  handlePokemonClick(pokemon: Pokemon): void {
    this.onPokemonSelect.emit(pokemon);
  }
}
