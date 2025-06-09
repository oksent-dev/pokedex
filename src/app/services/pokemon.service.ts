import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  from,
  of,
  forkJoin,
  throwError,
  firstValueFrom,
} from 'rxjs';
import {
  map,
  catchError,
  switchMap,
  filter,
  toArray,
  mergeMap,
} from 'rxjs/operators';
import {
  Pokemon,
  MoveDetails,
  EvolutionChain,
  EvolutionLink,
  PokemonSpecies,
  PokemonListResponse,
  TypeData,
  PokemonListItem,
  TypeListItem,
} from '../models/pokemon.model';

@Injectable({
  providedIn: 'root',
})
export class PokemonService {
  private http = inject(HttpClient);
  private baseUrl = 'https://pokeapi.co/api/v2';

  private allPokemonListItems = signal<PokemonListItem[]>([]);
  private allItemsFetched = signal(false);

  async fetchPokemons(nameOrId: string | number) {
    const url = `${this.baseUrl}/pokemon/${nameOrId}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching Pokémon: ${response.statusText}`);
    }
    return response.json();
  }

  async fetchPokemonByUrl(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching Pokémon: ${response.statusText}`);
    }
    return response.json();
  }
  async fetchPokemonList(
    offset: number,
    limit: number
  ): Promise<PokemonListResponse> {
    const url = `${this.baseUrl}/pokemon?limit=${limit}&offset=${offset}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching Pokemon list: ${response.statusText}`);
    }
    return response.json();
  }

  async fetchTotalPokemonCount(): Promise<number> {
    const url = `${this.baseUrl}/pokemon?limit=1`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Error fetching total Pokémon count: ${response.statusText}`
      );
    }
    const data: PokemonListResponse = await response.json();
    return data.count;
  }

  async fetchPokemonByType(type: string): Promise<any> {
    const url = `${this.baseUrl}/type/${type}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching Pokemon by type: ${response.statusText}`);
    }
    return response.json();
  }

  async fetchPokemonByGeneration(
    generationNameOrId: string | number
  ): Promise<PokemonListItem[]> {
    const url = `${this.baseUrl}/generation/${generationNameOrId}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Error fetching Pokemon by generation ${generationNameOrId}: ${response.statusText}`
      );
    }
    const data = await response.json();
    return data.pokemon_species.map(
      (species: { name: string; url: string }) => ({
        name: species.name,
        url: species.url.replace('/pokemon-species/', '/pokemon/'),
      })
    );
  }

  async fetchGenerationList(): Promise<Array<{ name: string; url: string }>> {
    const url = `${this.baseUrl}/generation`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching generation list: ${response.statusText}`);
    }
    const data = await response.json();
    return data.results;
  }

  async fetchRegionList(): Promise<Array<{ name: string; url: string }>> {
    const url = `${this.baseUrl}/region`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching region list: ${response.statusText}`);
    }
    const data = await response.json();
    return data.results;
  }

  async fetchPokemonByRegion(
    regionNameOrId: string | number
  ): Promise<PokemonListItem[]> {
    const regionUrl = `${this.baseUrl}/region/${regionNameOrId}`;
    const regionResponse = await fetch(regionUrl);
    if (!regionResponse.ok) {
      throw new Error(
        `Error fetching region data for ${regionNameOrId}: ${regionResponse.statusText}`
      );
    }
    const regionData = await regionResponse.json();

    const pokedexUrls = regionData.pokedexes.map(
      (pokedex: { url: string }) => pokedex.url
    );
    let pokemonEntries: PokemonListItem[] = [];

    for (const pokedexUrl of pokedexUrls) {
      try {
        const pokedexResponse = await fetch(pokedexUrl);
        if (!pokedexResponse.ok) {
          console.warn(
            `Error fetching pokedex ${pokedexUrl}: ${pokedexResponse.statusText}`
          );
          continue;
        }
        const pokedexData = await pokedexResponse.json();
        const items = pokedexData.pokemon_entries.map(
          (entry: { pokemon_species: { name: string; url: string } }) => ({
            name: entry.pokemon_species.name,
            url: entry.pokemon_species.url.replace(
              '/pokemon-species/',
              '/pokemon/'
            ),
          })
        );
        pokemonEntries.push(...items);
      } catch (error) {
        console.warn(`Exception fetching pokedex ${pokedexUrl}:`, error);
        continue;
      }
    }

    const uniquePokemon = Array.from(
      new Map(pokemonEntries.map((p) => [p.name, p])).values()
    );
    return uniquePokemon;
  }

  async fetchPokemonSpecies(
    nameOrId: string | number
  ): Promise<PokemonSpecies> {
    const url = `${this.baseUrl}/pokemon-species/${nameOrId}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Error fetching Pokémon species ${nameOrId}: ${response.statusText}`
      );
    }
    return response.json() as Promise<PokemonSpecies>;
  }

  async fetchEvolutionChainByUrl(url: string): Promise<EvolutionChain> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Error fetching evolution chain from ${url}: ${response.statusText}`
      );
    }
    const evolutionChainData = (await response.json()) as EvolutionChain;

    const populatePokemonInfo = async (link: EvolutionLink): Promise<void> => {
      const speciesId = this.getPokemonId(link.species.url);
      if (speciesId) {
        try {
          const pokemonData: Pokemon = await this.fetchPokemons(speciesId);
          link.pokemonInfo = {
            name: pokemonData.name,
            id: pokemonData.id,
            spriteUrl:
              pokemonData.sprites.front_default ||
              (pokemonData.sprites.other?.['official-artwork']?.front_default ??
                ''),
          };
        } catch (e) {
          console.error(
            `Failed to fetch Pokémon info for ${link.species.name} (ID: ${speciesId})`,
            e
          );
          link.pokemonInfo = {
            name: link.species.name,
            id: speciesId,
            spriteUrl: '',
          };
        }
      } else {
        link.pokemonInfo = { name: link.species.name, id: 0, spriteUrl: '' };
      }

      for (const nextLink of link.evolves_to) {
        await populatePokemonInfo(nextLink);
      }
    };

    if (evolutionChainData.chain) {
      await populatePokemonInfo(evolutionChainData.chain);
    }

    return evolutionChainData;
  }

  async fetchMoveDetails(nameOrId: string | number): Promise<MoveDetails> {
    const url = `${this.baseUrl}/move/${nameOrId}`;
    try {
      const response = await firstValueFrom(this.http.get<any>(url));
      return response as MoveDetails;
    } catch (error) {
      console.error(`Failed to fetch move details for ${nameOrId}:`, error);
      throw new Error(`Could not retrieve details for move ${nameOrId}.`);
    }
  }

  async fetchTypeList(): Promise<TypeListItem[]> {
    const url = `${this.baseUrl}/type`;
    try {
      const response = await firstValueFrom(
        this.http.get<PokemonListResponse>(url)
      );
      return response.results.map((item) => ({
        name: item.name,
        url: item.url,
      }));
    } catch (error) {
      console.error('Failed to fetch type list:', error);
      throw new Error('Could not retrieve the list of Pokémon types.');
    }
  }

  async fetchTypeDetails(nameOrId: string | number): Promise<TypeData> {
    const url = `${this.baseUrl}/type/${nameOrId}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Error fetching type details for ${nameOrId}: ${response.statusText}`
      );
    }
    return response.json() as Promise<TypeData>;
  }

  getAutocompleteSuggestions(query: string): Observable<PokemonListItem[]> {
    if (!this.allItemsFetched()) {
      return from(this.fetchAllPokemonListItems()).pipe(
        switchMap(() => this.filterPokemonItems(query))
      );
    }
    return this.filterPokemonItems(query);
  }

  private async fetchAllPokemonListItems(): Promise<void> {
    if (this.allItemsFetched()) return;

    const initialResponse = await this.fetchPokemonList(0, 1);
    const totalCount = initialResponse.count;
    const allItemsResponse = await this.fetchPokemonList(0, totalCount);
    this.allPokemonListItems.set(allItemsResponse.results);
    this.allItemsFetched.set(true);
  }

  private filterPokemonItems(query: string): Observable<PokemonListItem[]> {
    const lowerCaseQuery = query.toLowerCase();
    const filtered = this.allPokemonListItems().filter(
      (pokemon) =>
        pokemon.name.toLowerCase().includes(lowerCaseQuery) ||
        this.getPokemonId(pokemon.url).toString().includes(lowerCaseQuery)
    );
    return of(filtered.slice(0, 10));
  }

  formatPokemonName(name: string): string {
    return name
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  getPokemonId(url: string): number {
    const parts = url.split('/');
    return parseInt(parts[parts.length - 2], 10);
  }

  async fetchAllPokemonNames(): Promise<PokemonListItem[]> {
    let allPokemon: PokemonListItem[] = [];
    try {
      const initialResponse = await firstValueFrom(
        this.http.get<PokemonListResponse>(`${this.baseUrl}/pokemon?limit=1`)
      );
      const totalCount = initialResponse.count;

      if (totalCount > 0) {
        const response = await firstValueFrom(
          this.http.get<PokemonListResponse>(
            `${this.baseUrl}/pokemon?limit=${totalCount}`
          )
        );
        allPokemon = response.results;
      } else {
        const response = await firstValueFrom(
          this.http.get<PokemonListResponse>(
            `${this.baseUrl}/pokemon?limit=2000`
          )
        );
        allPokemon = response.results;
      }
      allPokemon.sort(
        (a, b) => this.getPokemonId(a.url) - this.getPokemonId(b.url)
      );
      return allPokemon;
    } catch (error) {
      console.error('Failed to fetch all Pokémon names:', error);
      throw new Error(
        'Could not retrieve the full list of Pokémon for searching.'
      );
    }
  }
}
