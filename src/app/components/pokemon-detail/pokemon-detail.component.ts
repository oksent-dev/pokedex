import {
  Component,
  inject,
  input,
  signal,
  effect,
  computed,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { PokemonService } from '../../services/pokemon.service';
import {
  Pokemon,
  POKEMON_TYPES,
  PokemonSpecies,
  EvolutionChain,
  EvolutionLink,
  EvolutionDetail,
  MoveDetails,
} from '../../models/pokemon.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pokemon-detail',
  imports: [
    MatCardModule,
    MatProgressBarModule,
    MatChipsModule,
    NgOptimizedImage,
    NgTemplateOutlet,
    FormsModule,
  ],
  template: `
    @if (loading() && !pokemon()) {
    <div class="text-center py-8">
      <p class="text-lg">Loading Pokemon details...</p>
    </div>
    } @else if (error() && !pokemon() && !isLoadingExtendedDetails()) {
    <div class="text-center py-8">
      <p class="text-red-500">{{ error() }}</p>
    </div>
    } @else { @if (pokemon(); as poke) {
    <div class="max-w-2xl mx-auto p-6">
      <div class="flex flex-col md:flex-row gap-6">
        <div class="flex-1">
          <div class="text-center mb-4">
            <span class="text-lg text-gray-500 font-medium">
              #{{ poke.id.toString().padStart(3, '0') }}
            </span>
            <h2 class="text-3xl font-bold mb-4">
              {{ pokemonService.formatPokemonName(poke.name) }}
            </h2>
          </div>

          @if (imageUrl(); as img) {
          <div
            class="w-48 h-48 mx-auto mb-4 bg-gray-50 rounded-lg flex items-center justify-center"
          >
            <img
              [ngSrc]="img"
              [alt]="poke.name + ' official artwork'"
              width="192"
              height="192"
              priority
              class="w-full h-full object-contain"
            />
          </div>
          }

          <div class="flex flex-wrap gap-2 justify-center mb-4">
            @for (type of poke.types; track type.type.name) {
            <span
              class="px-2 py-1 rounded-full text-sm text-white text-shadow-black text-shadow-md"
              [class]="POKEMON_TYPES[type.type.name].color || 'bg-gray-400'"
            >
              {{ POKEMON_TYPES[type.type.name].name || type.type.name }}
            </span>
            }
          </div>

          <div class="grid grid-cols-2 gap-4 text-center">
            <div class="bg-gray-50 rounded-lg p-3">
              <p class="text-sm text-gray-600">Height</p>
              <p class="text-lg font-semibold">
                {{ (poke.height / 10).toFixed(1) }} m
              </p>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <p class="text-sm text-gray-600">Weight</p>
              <p class="text-lg font-semibold">
                {{ (poke.weight / 10).toFixed(1) }} kg
              </p>
            </div>
          </div>
        </div>

        <!-- Stats and Abilities -->
        <div class="flex-1">
          <h3 class="text-xl font-bold mb-4">Base Stats</h3>
          <div class="space-y-3">
            @for (stat of poke.stats; track stat.stat.name) {
            <div class="space-y-1">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-gray-700">
                  {{ getStatName(stat.stat.name) }}
                </span>
                <span class="text-sm font-bold">
                  {{ stat.base_stat }}
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="h-2 rounded-full transition-all duration-300"
                  [class]="getStatColor(stat.base_stat)"
                  [style.width.%]="Math.min((stat.base_stat / 150) * 100, 100)"
                ></div>
              </div>
            </div>
            }
          </div>

          <div class="mt-6">
            <h3 class="text-lg font-bold mb-2">Abilities</h3>
            <div class="flex flex-wrap gap-2">
              @for (ability of poke.abilities; track ability.ability.name) {
              <mat-chip variant="outlined" class="px-3 py-1">
                {{ pokemonService.formatPokemonName(ability.ability.name) }}
              </mat-chip>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Flavor Text -->
      <div class="mt-8 pt-6 border-t border-gray-200">
        <h3 class="text-2xl font-semibold mb-3 text-gray-800">Pokédex Entry</h3>
        <div [class.opacity-60]="isLoadingExtendedDetails()">
          @if (speciesData()) {
          <p class="text-gray-700 italic leading-relaxed">
            {{ getFlavorText(speciesData()!) }}
          </p>
          } @else if (errorExtendedDetails() && !isLoadingExtendedDetails()) {
          <p class="text-red-500">
            Could not load Pokédex entry: {{ errorExtendedDetails() }}
          </p>
          } @else if (!isLoadingExtendedDetails()) {
          <p class="text-gray-500">No Pokédex entry data available.</p>
          }
        </div>
      </div>

      <!-- Evolution Chain -->
      <div class="mt-8 pt-6 border-t border-gray-200">
        <h3 class="text-2xl font-semibold mb-4 text-gray-800">
          Evolution Chain
        </h3>
        <div
          [class.opacity-60]="isLoadingExtendedDetails()"
          [class.pointer-events-none]="isLoadingExtendedDetails()"
        >
          @if (evolutionChain()) { @if (evolutionChain()!.chain &&
          (evolutionChain()!.chain.evolves_to.length > 0 ||
          evolutionChain()!.chain.pokemonInfo?.id !== pokemon()?.id ||
          (evolutionChain()!.chain.evolves_to.length === 0 && pokemon()?.id ===
          evolutionChain()!.chain.pokemonInfo?.id &&
          !speciesData()?.evolves_from_species))) {
          <div class="evolution-tree space-y-2">
            <ng-container
              [ngTemplateOutlet]="evolutionNodeTemplate"
              [ngTemplateOutletContext]="{
                $implicit: evolutionChain()!.chain,
                isBase: true
              }"
            ></ng-container>
          </div>
          } @else {
          <p class="text-gray-600">
            {{ pokemonService.formatPokemonName(poke.name) }} does not evolve
            further.
          </p>
          } } @else if (errorExtendedDetails() && !isLoadingExtendedDetails()) {
          <p class="text-red-500">
            Could not load evolution details: {{ errorExtendedDetails() }}
          </p>
          } @else if (!isLoadingExtendedDetails()) {
          <p class="text-gray-500">Evolution data not available.</p>
          }
        </div>
      </div>

      <ng-template #evolutionNodeTemplate let-node let-isBase="isBase">
        <div
          class="evolution-node flex items-center space-x-2 p-3 rounded-lg transition-all duration-200 ease-out"
          [class.bg-sky-50]="node.pokemonInfo?.id === pokemon()?.id"
          [class.border-sky-500]="node.pokemonInfo?.id === pokemon()?.id"
          [class.border]="node.pokemonInfo?.id === pokemon()?.id"
          [class.bg-gray-100]="node.pokemonInfo?.id !== pokemon()?.id"
          [class.cursor-pointer]="node.pokemonInfo?.id !== pokemon()?.id"
          [class.group]="node.pokemonInfo?.id !== pokemon()?.id"
          [class.hover:ring-2]="node.pokemonInfo?.id !== pokemon()?.id"
          [class.hover:ring-sky-300]="node.pokemonInfo?.id !== pokemon()?.id"
          [class.hover:shadow-lg]="node.pokemonInfo?.id !== pokemon()?.id"
          [class.hover:-translate-y-0.5]="
            node.pokemonInfo?.id !== pokemon()?.id
          "
          [class.hover:scale-105]="node.pokemonInfo?.id !== pokemon()?.id"
          (click)="onEvolutionClick(node)"
          (keydown.enter)="onEvolutionClick(node)"
          [attr.tabindex]="node.pokemonInfo?.id !== pokemon()?.id ? 0 : -1"
          [attr.role]="node.pokemonInfo?.id !== pokemon()?.id ? 'button' : null"
          [attr.aria-label]="
            node.pokemonInfo?.id !== pokemon()?.id
              ? 'View ' +
                pokemonService.formatPokemonName(
                  node.pokemonInfo?.name || node.species.name
                )
              : 'Current Pokémon'
          "
          [attr.aria-disabled]="node.pokemonInfo?.id === pokemon()?.id"
        >
          @if (node.pokemonInfo?.spriteUrl) {
          <img
            [ngSrc]="node.pokemonInfo.spriteUrl"
            [alt]="(node.pokemonInfo.name || node.species.name) + ' sprite'"
            width="64"
            height="64"
            class="bg-white rounded-full p-1 shadow-sm object-contain"
          />
          } @else {
          <div
            class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-500 shadow-sm"
          >
            No Sprite
          </div>
          }
          <div class="flex-grow">
            <p
              class="font-bold text-gray-800 text-lg transition-colors group-hover:text-sky-700"
            >
              {{
                pokemonService.formatPokemonName(
                  node.pokemonInfo?.name || node.species.name
                )
              }}
            </p>
            @if (node.pokemonInfo?.id) {
            <p class="text-xs text-gray-500">
              #{{ node.pokemonInfo.id.toString().padStart(3, '0') }}
            </p>
            }
          </div>
        </div>

        @if (node.evolves_to && node.evolves_to.length > 0) {
        <div class="evolves-to-wrapper flex items-stretch">
          <div
            class="evolution-arrows-container w-10 flex flex-col items-center justify-center py-2"
          >
            @for (_ of node.evolves_to; track $index; let first = $first, last =
            $last) {
            <div
              class="h-full w-px bg-gray-300"
              [class.invisible]="
                node.evolves_to.length === 1 &&
                node.evolves_to[0].evolves_to.length === 0
              "
            ></div>
            }
          </div>
          <div class="evolves-to-section flex-grow space-y-2">
            @for (evolutionDetailLink of node.evolves_to; track
            evolutionDetailLink.species.name; let i = $index) {
            <div class="evolution-step flex items-center">
              <div class="evolution-connector flex items-center mr-2">
                <span class="text-gray-400 text-2xl leading-none">&rarr;</span>
              </div>
              <div class="flex-grow">
                <div
                  class="evolution-conditions text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mb-1 inline-block shadow-sm"
                >
                  @for (detail of evolutionDetailLink.evolution_details; track
                  $index) {
                  <span>{{ formatEvolutionDetail(detail) }}</span>
                  }
                </div>
                <ng-container
                  [ngTemplateOutlet]="evolutionNodeTemplate"
                  [ngTemplateOutletContext]="{
                    $implicit: evolutionDetailLink,
                    isBase: false
                  }"
                ></ng-container>
              </div>
            </div>
            }
          </div>
        </div>
        }
      </ng-template>

      <h3
        class="text-2xl font-semibold mt-8 mb-4 pt-6 border-t border-gray-200 text-gray-800"
      >
        Moves
      </h3>

      <div
        class="my-4 p-4 bg-gray-50 rounded-lg shadow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end"
      >
        <div>
          <label
            for="moveSortKey"
            class="block text-sm font-medium text-gray-700"
            >Sort by:</label
          >
          <select
            id="moveSortKey"
            name="moveSortKey"
            [ngModel]="moveSortKey()"
            (ngModelChange)="moveSortKey.set($event)"
            class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          >
            <option value="level">Level</option>
            <option value="name">Name</option>
            <option value="learnMethod">Learn Method</option>
          </select>
        </div>
        <div>
          <label
            for="moveSortOrder"
            class="block text-sm font-medium text-gray-700"
            >Order:</label
          >
          <select
            id="moveSortOrder"
            name="moveSortOrder"
            [ngModel]="moveSortOrder()"
            (ngModelChange)="moveSortOrder.set($event)"
            class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
        <div>
          <label
            for="moveLearnMethodFilter"
            class="block text-sm font-medium text-gray-700"
            >Filter Learn Method:</label
          >
          <select
            id="moveLearnMethodFilter"
            name="moveLearnMethodFilter"
            [ngModel]="moveLearnMethodFilter()"
            (ngModelChange)="
              moveLearnMethodFilter.set($event === 'null' ? null : $event)
            "
            class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          >
            <option value="null">All Methods</option>
            @for (method of availableLearnMethods(); track method.value) {
            <option [value]="method.value">{{ method.displayName }}</option>
            }
          </select>
        </div>
      </div>

      @if (displayedMoves().length > 0) {
      <div class="overflow-x-auto">
        <table
          class="min-w-full bg-white border border-gray-200 rounded-lg shadow"
        >
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Name
              </th>
              <th
                class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Learn Method
              </th>
              <th
                class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Level
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            @for (move of displayedMoves(); track move.id) {
            <tr
              (click)="viewMoveDetails(move.rawName)"
              class="hover:bg-gray-100 cursor-pointer"
            >
              <td class="px-4 py-2 whitespace-nowrap font-medium text-sky-700">
                {{ move.name }}
              </td>
              <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                {{ move.learnMethodForDisplay }}
              </td>
              <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                {{ move.levelForDisplay ?? '-' }}
              </td>
            </tr>
            }
          </tbody>
        </table>
      </div>
      } @else {
      <p class="text-gray-500">This Pokémon currently has no moves listed.</p>
      }
    </div>
    } @else if (!loading() && !error()){
    <div class="text-center py-8">
      <p class="text-lg text-gray-600">Pokemon not found.</p>
      <p class="text-sm text-gray-500">
        Please check the ID or name and try again.
      </p>
    </div>
    } } @if (showMoveDetailsModal()) {
    <div
      class="fixed inset-0 bg-gradient-to-b from-blue-50 to-indigo-100 bg-opacity-60 flex items-center justify-center p-4 z-[100]"
    >
      <div
        class="bg-white rounded-lg shadow-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto"
      >
        @if (isLoadingMoveDetails()) {
        <p class="text-center text-gray-600">Loading move details...</p>
        } @else if (errorMoveDetails()) {
        <div class="text-center">
          <h3 class="text-xl font-semibold mb-2 text-red-700">
            Error Loading Move
          </h3>
          <p class="text-red-600 bg-red-50 p-3 rounded">
            {{ errorMoveDetails() }}
          </p>
        </div>
        } @else if (selectedMoveDetails()) {
        <h3 class="text-3xl font-bold mb-2 text-center text-sky-700">
          {{ pokemonService.formatPokemonName(selectedMoveDetails()!.name) }}
        </h3>
        <div class="text-center mb-5">
          <span
            class="px-3 py-1 text-sm font-semibold rounded-full text-white mr-2"
            [class]="
              POKEMON_TYPES[selectedMoveDetails()!.type.name].color ||
              'bg-gray-500'
            "
          >
            {{
              POKEMON_TYPES[selectedMoveDetails()!.type.name].name ||
                pokemonService.formatPokemonName(
                  selectedMoveDetails()!.type.name
                )
            }}
          </span>
          <span
            class="px-3 py-1 text-sm font-semibold rounded-full text-white"
            [class]="
              getDamageClassColor(selectedMoveDetails()!.damage_class.name)
            "
          >
            {{
              pokemonService.formatPokemonName(
                selectedMoveDetails()!.damage_class.name
              )
            }}
          </span>
        </div>
        <div
          class="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-sm mb-5 p-4 bg-gray-50 rounded-md"
        >
          <p>
            <strong class="text-gray-600">Power:</strong>
            <span class="font-mono">{{
              selectedMoveDetails()!.power ?? '-'
            }}</span>
          </p>
          <p>
            <strong class="text-gray-600">Accuracy:</strong>
            <span class="font-mono"
              >{{ selectedMoveDetails()!.accuracy ?? '-' }}%</span
            >
          </p>
          <p>
            <strong class="text-gray-600">PP:</strong>
            <span class="font-mono">{{
              selectedMoveDetails()!.pp ?? '-'
            }}</span>
          </p>
          <p>
            <strong class="text-gray-600">Priority:</strong>
            <span class="font-mono">{{ selectedMoveDetails()!.priority }}</span>
          </p>
          @if (selectedMoveDetails()!.meta?.crit_rate) {
          <p>
            <strong class="text-gray-600">Crit Rate:</strong>
            <span class="font-mono"
              >+{{ selectedMoveDetails()!.meta!.crit_rate }}</span
            >
          </p>
          } @if (selectedMoveDetails()!.meta?.flinch_chance) {
          <p>
            <strong class="text-gray-600">Flinch:</strong>
            <span class="font-mono"
              >{{ selectedMoveDetails()!.meta!.flinch_chance * 100 }}%</span
            >
          </p>
          }
        </div>
        @if (getMoveEffect(selectedMoveDetails()!); as effect) {
        <div class="mb-4">
          <h4 class="font-semibold text-gray-700 mb-1">Effect:</h4>
          <p class="text-sm text-gray-600 leading-relaxed">{{ effect }}</p>
        </div>
        } @if (getMoveFlavorText(selectedMoveDetails()!); as flavor) {
        <div class="mb-4 pt-3 border-t border-gray-200">
          <h4 class="font-semibold text-gray-700 mb-1">Description:</h4>
          <p class="text-sm text-gray-600 italic leading-relaxed">
            {{ flavor }}
          </p>
        </div>
        } } @else {
        <p class="text-center text-gray-500">No move details available.</p>
        }
        <button
          (click)="
            showMoveDetailsModal.set(false); selectedMoveDetails.set(null)
          "
          class="mt-6 w-full px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
    }
  `,
  styles: `
    mat-chip[variant="outlined"] {
      border: 1px solid #e5e7eb !important;
      background-color: white !important;
      color: #374151 !important;
    }
  `,
})
export class PokemonDetailComponent {
  pokemonId = input<number | undefined>();
  pokemonData = input<Pokemon | undefined>();

  pokemonService = inject(PokemonService);
  POKEMON_TYPES = POKEMON_TYPES;
  Math = Math;

  pokemon = signal<Pokemon | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  speciesData = signal<PokemonSpecies | null>(null);
  evolutionChain = signal<EvolutionChain | null>(null);
  isLoadingExtendedDetails = signal(false);
  errorExtendedDetails = signal<string | null>(null);

  selectedMoveDetails = signal<MoveDetails | null>(null);
  isLoadingMoveDetails = signal(false);
  errorMoveDetails = signal<string | null>(null);
  showMoveDetailsModal = signal(false);

  moveSortKey = signal<'level' | 'name' | 'learnMethod'>('level');
  moveSortOrder = signal<'asc' | 'desc'>('asc');
  moveLearnMethodFilter = signal<string | null>(null);

  availableLearnMethods = computed(() => {
    const currentPokemon = this.pokemon();
    if (!currentPokemon || !currentPokemon.moves) return [];
    const methods = new Set<string>();
    currentPokemon.moves.forEach((moveEntry: any) => {
      moveEntry.version_group_details.forEach((vgd: any) => {
        methods.add(vgd.move_learn_method.name);
      });
    });
    return Array.from(methods)
      .map((method) => ({
        value: method,
        displayName: this.pokemonService.formatPokemonName(method),
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  });

  imageUrl = computed(() => {
    const poke = this.pokemon();
    if (!poke) return null;
    return (
      poke.sprites.other['official-artwork'].front_default ||
      poke.sprites.front_default
    );
  });

  displayedMoves = computed(() => {
    const currentPokemon = this.pokemon();
    if (!currentPokemon || !currentPokemon.moves) return [];

    let movesToDisplay = currentPokemon.moves.map((moveEntry: any) => {
      const name = this.pokemonService.formatPokemonName(moveEntry.move.name);
      const url = moveEntry.move.url;
      let primaryLearnMethod = 'N/A';
      let primaryLevel: number | null = null;
      const allLearnMethodsThisMove: string[] = [];

      moveEntry.version_group_details.forEach((vgd: any) => {
        allLearnMethodsThisMove.push(vgd.move_learn_method.name);
      });

      const levelUpDetails = moveEntry.version_group_details
        .filter(
          (vgd: any) =>
            vgd.move_learn_method.name === 'level-up' &&
            vgd.level_learned_at > 0
        )
        .sort((a: any, b: any) => a.level_learned_at - b.level_learned_at);

      if (levelUpDetails.length > 0) {
        primaryLevel = levelUpDetails[0].level_learned_at;
        primaryLearnMethod = 'level-up';
      } else if (moveEntry.version_group_details.length > 0) {
        const firstVGD = moveEntry.version_group_details[0];
        primaryLearnMethod = firstVGD.move_learn_method.name;
        if (firstVGD.level_learned_at > 0) {
          primaryLevel = firstVGD.level_learned_at;
        }
      }

      let moveId = 0;
      try {
        if (url && url.includes('/move/')) {
          moveId = this.pokemonService.getPokemonId(url);
        }
      } catch (e) {
        console.warn(`Could not parse ID from move URL: ${url}`, e);
        moveId = Date.now() + Math.random();
      }

      return {
        name: name,
        id: moveId || moveEntry.move.name,
        learnMethodForDisplay:
          this.pokemonService.formatPokemonName(primaryLearnMethod),
        levelForDisplay: primaryLevel,
        rawName: moveEntry.move.name,

        _internalAllLearnMethods: Array.from(new Set(allLearnMethodsThisMove)),
        _internalSortLevel: primaryLevel === null ? Infinity : primaryLevel,
        _internalSortLearnMethod: primaryLearnMethod.toLowerCase(),
      };
    });

    const currentLearnMethodFilter = this.moveLearnMethodFilter();
    if (currentLearnMethodFilter) {
      movesToDisplay = movesToDisplay.filter((move: any) =>
        move._internalAllLearnMethods.includes(currentLearnMethodFilter)
      );
    }

    const key = this.moveSortKey();
    const orderFactor = this.moveSortOrder() === 'asc' ? 1 : -1;

    movesToDisplay.sort((a: any, b: any) => {
      let valA, valB;
      if (key === 'level') {
        valA = a._internalSortLevel;
        valB = b._internalSortLevel;
        if (orderFactor === -1) {
          // Descending sort for levels
          if (valA === Infinity && valB !== Infinity) return 1;
          if (valB === Infinity && valA !== Infinity) return -1;
        }
      } else if (key === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else {
        // learnMethod
        valA = a._internalSortLearnMethod;
        valB = b._internalSortLearnMethod;
      }

      let comparison = 0;
      if (valA < valB) comparison = -1;
      else if (valA > valB) comparison = 1;

      comparison *= orderFactor;

      if (comparison === 0 && key !== 'name') {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      }
      return comparison;
    });

    return movesToDisplay;
  });

  constructor() {
    effect(
      async () => {
        const inputPokemon = this.pokemonData();
        const inputId = this.pokemonId();

        this.pokemon.set(null);
        this.speciesData.set(null);
        this.evolutionChain.set(null);
        this.selectedMoveDetails.set(null);
        this.error.set(null);
        this.errorExtendedDetails.set(null);
        this.errorMoveDetails.set(null);
        this.loading.set(false);
        this.isLoadingExtendedDetails.set(false);
        this.isLoadingMoveDetails.set(false);
        this.showMoveDetailsModal.set(false);

        let currentPokemonForExtendedDetails: Pokemon | null = null;

        if (inputPokemon) {
          this.pokemon.set(inputPokemon);
          currentPokemonForExtendedDetails = inputPokemon;
        } else if (inputId !== undefined && inputId !== null) {
          this.loading.set(true);
          try {
            const fetchedPokemon = await this.pokemonService.fetchPokemons(
              inputId
            );
            this.pokemon.set(fetchedPokemon);
            currentPokemonForExtendedDetails = fetchedPokemon;
          } catch (err) {
            this.error.set(
              err instanceof Error
                ? err.message
                : 'Failed to fetch Pokemon details'
            );
            this.pokemon.set(null);
          } finally {
            this.loading.set(false);
          }
        }

        if (currentPokemonForExtendedDetails) {
          if (
            currentPokemonForExtendedDetails.id !== undefined &&
            currentPokemonForExtendedDetails.id !== null
          ) {
            await this.fetchExtendedDetails(
              currentPokemonForExtendedDetails.id
            );
          }
        }
      },
      { allowSignalWrites: true }
    );
  }

  // Click handler for evolution nodes
  async onEvolutionClick(link: EvolutionLink): Promise<void> {
    const targetId =
      link.pokemonInfo?.id ||
      this.pokemonService.getPokemonId(link.species.url);
    if (!targetId || targetId === this.pokemon()?.id) return;
    await this.navigateToPokemonById(targetId);
  }

  // Load another Pokémon into the current detail view
  private async navigateToPokemonById(pokemonId: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    // Do not clear species/evolution to avoid layout shift; keep showing previous until new data arrives
    this.selectedMoveDetails.set(null);
    this.errorExtendedDetails.set(null);
    this.errorMoveDetails.set(null);
    this.showMoveDetailsModal.set(false);
    try {
      const fetchedPokemon = await this.pokemonService.fetchPokemons(pokemonId);
      this.pokemon.set(fetchedPokemon);
      await this.fetchExtendedDetails(fetchedPokemon.id);
      if (typeof window !== 'undefined' && window?.scrollTo) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      this.error.set(
        err instanceof Error ? err.message : 'Failed to load Pokémon details'
      );
    } finally {
      this.loading.set(false);
    }
  }

  private async fetchExtendedDetails(pokemonId: number): Promise<void> {
    this.isLoadingExtendedDetails.set(true);
    this.errorExtendedDetails.set(null);
    try {
      const species = await this.pokemonService.fetchPokemonSpecies(pokemonId);
      this.speciesData.set(species);
      if (species.evolution_chain.url) {
        const chain = await this.pokemonService.fetchEvolutionChainByUrl(
          species.evolution_chain.url
        );
        this.evolutionChain.set(chain);
      } else {
        this.evolutionChain.set(null);
      }
    } catch (err) {
      this.errorExtendedDetails.set(
        err instanceof Error
          ? err.message
          : 'Failed to load extended Pokemon details'
      );
      this.speciesData.set(null);
      this.evolutionChain.set(null);
    } finally {
      this.isLoadingExtendedDetails.set(false);
    }
  }

  async viewMoveDetails(moveNameOrId: string | number): Promise<void> {
    this.selectedMoveDetails.set(null);
    this.isLoadingMoveDetails.set(true);
    this.errorMoveDetails.set(null);
    this.showMoveDetailsModal.set(true);
    try {
      const details = await this.pokemonService.fetchMoveDetails(moveNameOrId);
      this.selectedMoveDetails.set(details);
    } catch (err) {
      this.errorMoveDetails.set(
        err instanceof Error ? err.message : 'Failed to load move details'
      );
    } finally {
      this.isLoadingMoveDetails.set(false);
    }
  }

  getFlavorText(species: PokemonSpecies | null): string | null {
    if (!species || !species.flavor_text_entries) return null;
    const englishEntries = species.flavor_text_entries.filter(
      (entry) => entry.language.name === 'en'
    );
    if (englishEntries.length === 0)
      return 'No English Pokédex entry available.';

    const preferredVersions = [
      'scarlet',
      'violet',
      'sword',
      'shield',
      'lets-go-pikachu',
      'ultra-sun',
      'sun',
      'moon',
      'omega-ruby',
      'alpha-sapphire',
      'x',
      'y',
    ];
    for (const pv of preferredVersions) {
      const entry = englishEntries.find((e) => e.version.name === pv);
      if (entry)
        return entry.flavor_text.replace(/+/g, ' ').replace(/\n/g, ' ').trim();
    }
    return englishEntries[englishEntries.length - 1].flavor_text
      .replace(/+/g, ' ')
      .replace(/\n/g, ' ')
      .trim();
  }

  formatEvolutionDetail(detail: EvolutionDetail): string {
    const conditions: string[] = [];
    if (detail.min_level !== null) conditions.push(`Lv. ${detail.min_level}`);
    if (detail.item)
      conditions.push(
        `Use ${this.pokemonService.formatPokemonName(detail.item.name)}`
      );
    if (detail.held_item)
      conditions.push(
        `Hold ${this.pokemonService.formatPokemonName(detail.held_item.name)}`
      );
    if (detail.known_move)
      conditions.push(
        `Knows ${this.pokemonService.formatPokemonName(detail.known_move.name)}`
      );
    if (detail.time_of_day && detail.time_of_day !== '')
      conditions.push(
        this.pokemonService.formatPokemonName(detail.time_of_day)
      );
    if (detail.location)
      conditions.push(
        `at ${this.pokemonService.formatPokemonName(detail.location.name)}`
      );
    if (detail.min_happiness !== null)
      conditions.push(`Happiness ${detail.min_happiness}+`);
    if (detail.min_affection !== null)
      conditions.push(`Affection ${detail.min_affection}+`);
    if (detail.min_beauty !== null)
      conditions.push(`Beauty ${detail.min_beauty}+`);
    if (detail.needs_overworld_rain) conditions.push('Overworld Rain');
    if (detail.turn_upside_down) conditions.push('Turn Console Upside Down');

    // Gender: 1 for female, 2 for male. PokeAPI does not use 0 for genderless in this context.
    if (detail.gender === 1) conditions.push('Female');
    else if (detail.gender === 2) conditions.push('Male');

    if (detail.trigger.name === 'trade') {
      if (detail.trade_species) {
        conditions.push(
          `Trade for ${this.pokemonService.formatPokemonName(
            detail.trade_species.name
          )}`
        );
      } else {
        conditions.push('Trade');
      }
    } else if (detail.trigger.name === 'shed' && conditions.length === 0) {
      conditions.push('Special (Shedinja)');
    }

    if (conditions.length === 0 && detail.trigger.name === 'level-up')
      return 'Level Up';
    if (conditions.length === 0)
      return this.pokemonService.formatPokemonName(detail.trigger.name);

    return conditions.join(', ');
  }

  getDamageClassColor(damageClassName: string): string {
    if (damageClassName === 'physical') return 'bg-orange-500';
    if (damageClassName === 'special') return 'bg-indigo-500';
    if (damageClassName === 'status') return 'bg-gray-400';
    return 'bg-pink-400';
  }

  getMoveEffect(move: MoveDetails | null): string | null {
    if (!move || !move.effect_entries) return null;
    const englishEffect = move.effect_entries.find(
      (e) => e.language.name === 'en'
    );
    return englishEffect
      ? englishEffect.short_effect.replace(
          '$effect_chance',
          move.effect_chance?.toString() || ''
        )
      : null;
  }

  getMoveFlavorText(move: MoveDetails | null): string | null {
    if (!move || !move.flavor_text_entries) return null;
    const englishEntries = move.flavor_text_entries.filter(
      (e) => e.language.name === 'en'
    );
    if (englishEntries.length === 0) return null;
    const preferredVGs = [
      'scarlet-violet',
      'sword-shield',
      'sun-moon',
      'ultra-sun-ultra-moon',
    ];
    for (const vg of preferredVGs) {
      const entry = englishEntries.find((e) => e.version_group.name === vg);
      if (entry)
        return entry.flavor_text.replace(//g, ' ').replace(/\n/g, ' ').trim();
    }
    return englishEntries[englishEntries.length - 1].flavor_text
      .replace(//g, ' ')
      .replace(/\n/g, ' ')
      .trim();
  }

  getStatColor(statValue: number): string {
    if (statValue >= 100) return 'bg-green-500';
    if (statValue >= 70) return 'bg-yellow-500';
    if (statValue >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  }

  getStatName(statName: string): string {
    const statNames: Record<string, string> = {
      hp: 'HP',
      attack: 'Attack',
      defense: 'Defense',
      'special-attack': 'Sp. Attack',
      'special-defense': 'Sp. Defense',
      speed: 'Speed',
    };
    return statNames[statName] || statName;
  }
}
