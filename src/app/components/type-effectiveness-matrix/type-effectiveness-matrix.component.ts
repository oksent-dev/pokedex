import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common'; // For @for, @if
import { PokemonService } from '../../services/pokemon.service';
import {
  TypeData,
  TypeListItem,
  POKEMON_TYPES,
  PokemonType,
} from '../../models/pokemon.model';

@Component({
  selector: 'app-type-effectiveness-matrix',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 max-w-4xl mx-auto">
      <h2 class="text-2xl font-bold mb-6 text-center text-gray-800">
        Type Effectiveness Calculator
      </h2>

      @if (isLoading()) {
      <p class="text-center text-gray-600">Loading type data...</p>
      } @else if (error()) {
      <p class="text-center text-red-500 bg-red-50 p-3 rounded-md">
        Error: {{ error() }}
      </p>
      } @else {
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 mb-8">
        <div>
          <h3 class="text-lg font-semibold mb-3 text-gray-700">
            Attacking Type:
          </h3>
          <div class="flex flex-wrap gap-2">
            @for (type of typeListForDisplay(); track type.name) {
            <button
              (click)="selectAttackingType(type.name)"
              [class]="getButtonClasses(type.name, 'attacking')"
              class="px-3 py-1.5 text-sm font-medium rounded-md shadow-sm transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              {{ pokemonService.formatPokemonName(type.name) }}
            </button>
            }
          </div>
          @if (attackingType()) {
          <div class="mt-3 p-2 bg-gray-100 rounded text-center">
            Selected:
            <span
              [class]="
                (POKEMON_TYPES[attackingType()!] || { color: 'bg-gray-400' })
                  .color
              "
              class="px-2 py-0.5 text-xs text-white rounded-full ml-1"
            >
              {{ pokemonService.formatPokemonName(attackingType()!) }}
            </span>
            <button
              (click)="clearAttackingType()"
              class="ml-2 text-red-500 hover:text-red-700 text-xs font-semibold"
            >
              &times; Clear
            </button>
          </div>
          }
        </div>

        <div>
          <h3 class="text-lg font-semibold mb-3 text-gray-700">
            Defending Type(s) (Max 2):
          </h3>
          <div class="flex flex-wrap gap-2">
            @for (type of typeListForDisplay(); track type.name) {
            <button
              (click)="toggleDefendingType(type.name)"
              [class]="getButtonClasses(type.name, 'defending')"
              class="px-3 py-1.5 text-sm font-medium rounded-md shadow-sm transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              {{ pokemonService.formatPokemonName(type.name) }}
            </button>
            }
          </div>
          @if (defendingTypes().length > 0) {
          <div class="mt-3 p-2 bg-gray-100 rounded text-center">
            Selected: @for (defType of defendingTypes(); track defType) {
            <span
              [class]="
                (POKEMON_TYPES[defType] || { color: 'bg-gray-400' }).color
              "
              class="px-2 py-0.5 text-xs text-white rounded-full ml-1"
            >
              {{ pokemonService.formatPokemonName(defType) }}
            </span>
            }
            <button
              (click)="clearDefendingTypes()"
              class="ml-2 text-red-500 hover:text-red-700 text-xs font-semibold"
            >
              &times; Clear All
            </button>
          </div>
          }
        </div>
      </div>

      <div class="mt-8 pt-6 border-t border-gray-200">
        <h3 class="text-xl font-semibold mb-4 text-center text-gray-700">
          Effectiveness Results
        </h3>
        @if (effectivenessOutput(); as output) { @if (output.attackVsDefense &&
        attackingType() && defendingTypes().length > 0) {
        <div class="mb-8 p-4 bg-sky-50 rounded-lg shadow text-center">
          <p class="text-lg font-semibold text-sky-800">
            <span
              [class]="
                (POKEMON_TYPES[attackingType()!] || { color: 'bg-gray-400' })
                  .color
              "
              class="px-2 py-1 text-white rounded-full text-sm"
              >{{ pokemonService.formatPokemonName(attackingType()!) }}</span
            >
            <span class="mx-2">vs</span>
            @for (defType of defendingTypes(); track defType; let last = $last)
            {
            <span
              [class]="
                (POKEMON_TYPES[defType] || { color: 'bg-gray-400' }).color
              "
              class="px-2 py-1 text-white rounded-full text-sm"
              >{{ pokemonService.formatPokemonName(defType) }}</span
            >
            @if (!last) { <span class="mx-1">/</span> } }
          </p>
          <p
            class="text-2xl font-bold mt-2"
            [ngClass]="getMultiplierColor(output.attackVsDefense.multiplier)"
          >
            {{ output.attackVsDefense.multiplier }}x
          </p>
          <p class="text-md text-gray-700">
            {{ output.attackVsDefense.effectivenessMessage }}
          </p>
        </div>
        }

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          @if (attackingType() && output.attackCoverage.length > 0) {
          <div class="p-4 bg-white rounded-lg shadow">
            <h4 class="text-md font-semibold mb-3 text-gray-700">
              Attacking with
              <span
                [class]="
                  (POKEMON_TYPES[attackingType()!] || { color: 'bg-gray-400' })
                    .color
                "
                class="px-2 py-0.5 text-white rounded-full text-xs"
                >{{ pokemonService.formatPokemonName(attackingType()!) }}</span
              >:
            </h4>
            <div class="space-y-1 text-sm max-h-60 overflow-y-auto">
              @for (eff of output.attackCoverage; track eff.typeName) {
              <div
                class="flex justify-between items-center p-1.5 rounded hover:bg-gray-50"
              >
                <span
                  [class]="eff.color"
                  class="px-2 py-0.5 text-white rounded-full text-xs"
                  >{{ eff.formattedName }}</span
                >
                <span
                  class="font-medium"
                  [ngClass]="getMultiplierColor(eff.multiplier)"
                  >{{ eff.multiplier }}x</span
                >
              </div>
              }
            </div>
          </div>
          } @else if (attackingType()) {
          <div class="p-4 bg-white rounded-lg shadow">
            <p class="text-sm text-gray-500">
              No attack coverage data to display for the selected attacking
              type.
            </p>
          </div>
          } @if (defendingTypes().length > 0 && output.defenseProfile.length >
          0) {
          <div class="p-4 bg-white rounded-lg shadow">
            <h4 class="text-md font-semibold mb-3 text-gray-700">
              Defending as @for (defType of defendingTypes(); track defType; let
              last = $last) {
              <span
                [class]="
                  (POKEMON_TYPES[defType] || { color: 'bg-gray-400' }).color
                "
                class="px-2 py-0.5 text-white rounded-full text-xs"
                >{{ pokemonService.formatPokemonName(defType) }}</span
              >
              @if (!last) { <span class="mx-0.5">/</span> } } (takes from):
            </h4>
            <div class="space-y-1 text-sm max-h-60 overflow-y-auto">
              @for (eff of output.defenseProfile; track eff.typeName) {
              <div
                class="flex justify-between items-center p-1.5 rounded hover:bg-gray-50"
              >
                <span
                  [class]="eff.color"
                  class="px-2 py-0.5 text-white rounded-full text-xs"
                  >{{ eff.formattedName }}</span
                >
                <span
                  class="font-medium"
                  [ngClass]="getMultiplierColor(eff.multiplier)"
                  >{{ eff.multiplier }}x</span
                >
              </div>
              }
            </div>
          </div>
          } @else if (defendingTypes().length > 0) {
          <div class="p-4 bg-white rounded-lg shadow">
            <p class="text-sm text-gray-500">
              No defense profile data to display for the selected defending
              type(s).
            </p>
          </div>
          }
        </div>
        } @else if (!attackingType() && defendingTypes().length === 0 &&
        !isLoading()) {
        <p class="text-center text-gray-500 mt-4">
          Select an attacking type and/or defending type(s) to see
          effectiveness.
        </p>
        }
      </div>
      }
    </div>
  `,
})
export class TypeEffectivenessMatrixComponent implements OnInit {
  pokemonService = inject(PokemonService);
  POKEMON_TYPES: Record<string, PokemonType> = POKEMON_TYPES;

  allTypeDetails = signal<Record<string, TypeData>>({});
  typeListForDisplay = signal<TypeListItem[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  attackingType = signal<string | null>(null);
  defendingTypes = signal<string[]>([]);

  async ngOnInit(): Promise<void> {
    await this.initializeTypeData();
  }

  async initializeTypeData(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const typeList = await this.pokemonService.fetchTypeList();
      const filteredTypeList = typeList.filter(
        (typeItem) => this.POKEMON_TYPES[typeItem.name]
      );
      this.typeListForDisplay.set(
        filteredTypeList.sort((a, b) => a.name.localeCompare(b.name))
      );

      if (filteredTypeList.length === 0 && typeList.length > 0) {
        console.warn(
          'Type list was filtered completely. Check POKEMON_TYPES consistency with API.'
        );
      }

      const typeDetailsPromises = filteredTypeList.map((typeItem) =>
        this.pokemonService.fetchTypeDetails(typeItem.name)
      );
      const allDetailsArray = await Promise.all(typeDetailsPromises);

      const detailsRecord: Record<string, TypeData> = {};
      allDetailsArray.forEach((detail) => {
        detailsRecord[detail.name] = detail;
      });
      this.allTypeDetails.set(detailsRecord);
    } catch (err) {
      this.error.set(
        err instanceof Error ? err.message : 'Failed to load type data'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  selectAttackingType(typeName: string): void {
    if (this.attackingType() === typeName) {
      this.attackingType.set(null);
    } else {
      this.attackingType.set(typeName);
    }
  }

  clearAttackingType(): void {
    this.attackingType.set(null);
  }

  toggleDefendingType(typeName: string): void {
    this.defendingTypes.update((current) => {
      const index = current.indexOf(typeName);
      if (index > -1) {
        return current.filter((t) => t !== typeName);
      } else if (current.length < 2) {
        return [...current, typeName];
      }
      return current;
    });
  }

  clearDefendingTypes(): void {
    this.defendingTypes.set([]);
  }

  getButtonClasses(
    typeName: string,
    selectionGroup: 'attacking' | 'defending'
  ): string {
    const typeStyle = this.POKEMON_TYPES[typeName] || {
      color: 'bg-gray-400',
      ringColor: 'ring-gray-600',
    };
    let isActive = false;

    if (selectionGroup === 'attacking') {
      isActive = this.attackingType() === typeName;
    } else {
      isActive = this.defendingTypes().includes(typeName);
    }

    const baseClasses = 'border-2 transition-all duration-150 ease-in-out';
    const activeClasses = `ring-2 ring-offset-1 ${'ring-black'} brightness-110`;
    const inactiveClasses = `hover:brightness-125 border-transparent`;

    return `${baseClasses} ${typeStyle.color} text-white ${
      isActive ? activeClasses : inactiveClasses
    }`;
  }

  getMultiplierColor(multiplier: number): string {
    if (multiplier >= 2) return 'text-green-600 font-bold';
    if (multiplier === 1) return 'text-gray-700';
    if (multiplier > 0 && multiplier < 1)
      return 'text-orange-600 font-semibold';
    if (multiplier === 0) return 'text-red-600 font-bold';
    return 'text-black';
  }

  effectivenessOutput = computed<EffectivenessResult>(() => {
    const result: EffectivenessResult = {
      attackVsDefense: null,
      attackCoverage: [],
      defenseProfile: [],
    };

    const attackerName = this.attackingType();
    const defenderNames = this.defendingTypes();
    const allTypesData = this.allTypeDetails();
    const allDisplayTypes = this.typeListForDisplay();

    if (
      Object.keys(allTypesData).length === 0 ||
      allDisplayTypes.length === 0
    ) {
      return result;
    }

    const getMultiplierAgainstDefender = (
      attTypeData: TypeData,
      defTypeName: string
    ): number => {
      if (
        attTypeData.damage_relations.double_damage_to.some(
          (t) => t.name === defTypeName
        )
      )
        return 2;
      if (
        attTypeData.damage_relations.half_damage_to.some(
          (t) => t.name === defTypeName
        )
      )
        return 0.5;
      if (
        attTypeData.damage_relations.no_damage_to.some(
          (t) => t.name === defTypeName
        )
      )
        return 0;
      return 1;
    };

    // Calculate Attack vs Defense
    if (attackerName && defenderNames.length > 0) {
      const attackerData = allTypesData[attackerName];
      if (attackerData) {
        let finalMultiplier = 1;

        defenderNames.forEach((defName) => {
          const defenderData = allTypesData[defName];
          if (defenderData) {
            finalMultiplier *= getMultiplierAgainstDefender(
              attackerData,
              defName
            );
          }
        });

        let effectivenessMessage = '';
        if (finalMultiplier >= 2) effectivenessMessage = 'Super effective!';
        else if (finalMultiplier === 1)
          effectivenessMessage = 'Normally effective.';
        else if (finalMultiplier > 0)
          effectivenessMessage = 'Not very effective...';
        else effectivenessMessage = 'No effect!';

        result.attackVsDefense = {
          multiplier: finalMultiplier,
          defendingTypesSummary: defenderNames
            .map((dn) => this.pokemonService.formatPokemonName(dn))
            .join(' / '),
          effectivenessMessage,
        };
      }
    }

    // Calculate Attack Coverage
    if (attackerName) {
      const attackerData = allTypesData[attackerName];
      if (attackerData) {
        result.attackCoverage = allDisplayTypes
          .map((typeToDefend) => {
            let multiplier = 1;
            multiplier = getMultiplierAgainstDefender(
              attackerData,
              typeToDefend.name
            );

            return {
              typeName: typeToDefend.name,
              multiplier: multiplier,
              color: (
                this.POKEMON_TYPES[typeToDefend.name] || {
                  color: 'bg-gray-400',
                }
              ).color,
              formattedName: this.pokemonService.formatPokemonName(
                typeToDefend.name
              ),
            };
          })
          .sort(
            (a, b) =>
              b.multiplier - a.multiplier ||
              a.formattedName!.localeCompare(b.formattedName!)
          );
      }
    }

    // Calculate Defense Profile
    if (defenderNames.length > 0) {
      result.defenseProfile = allDisplayTypes
        .map((typeToAttackWith) => {
          const potentialAttackerData = allTypesData[typeToAttackWith.name];
          let finalMultiplier = 1;
          if (potentialAttackerData) {
            defenderNames.forEach((defName) => {
              finalMultiplier *= getMultiplierAgainstDefender(
                potentialAttackerData,
                defName
              );
            });
          }
          return {
            typeName: typeToAttackWith.name,
            multiplier: finalMultiplier,
            color: (
              this.POKEMON_TYPES[typeToAttackWith.name] || {
                color: 'bg-gray-400',
              }
            ).color,
            formattedName: this.pokemonService.formatPokemonName(
              typeToAttackWith.name
            ),
          };
        })
        .sort(
          (a, b) =>
            a.multiplier - b.multiplier ||
            a.formattedName!.localeCompare(b.formattedName!)
        );
    }
    return result;
  });
}

interface SingleTypeEffectiveness {
  typeName: string;
  multiplier: number;
  color?: string;
  formattedName?: string;
}

interface EffectivenessResult {
  attackVsDefense: {
    multiplier: number;
    defendingTypesSummary: string;
    effectivenessMessage: string;
  } | null;
  attackCoverage: SingleTypeEffectiveness[];
  defenseProfile: SingleTypeEffectiveness[];
}
