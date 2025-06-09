export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    front_default: string;
    other: {
      'official-artwork': {
        front_default: string;
      };
    };
  };
  types: Array<{
    type: {
      name: string;
      url: string;
    };
  }>;
  stats: Array<{
    base_stat: number;
    stat: {
      name: string;
    };
  }>;
  abilities: Array<{
    ability: {
      name: string;
    };
  }>;
  moves: Array<{
    // Added moves property
    move: {
      name: string;
      url: string;
    };
    version_group_details: Array<{
      level_learned_at: number;
      move_learn_method: {
        name: string;
        url: string;
      };
      version_group: {
        name: string;
        url: string;
      };
    }>;
  }>;
}

export interface PokemonListItem {
  name: string;
  url: string;
}

export interface PokemonListResponse {
  results: PokemonListItem[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface PokemonType {
  name: string;
  color: string;
}

export const POKEMON_TYPES: Record<string, PokemonType> = {
  normal: { name: 'Normal', color: 'bg-gray-400' },
  fire: { name: 'Fire', color: 'bg-red-500' },
  water: { name: 'Water', color: 'bg-blue-500' },
  electric: { name: 'Electric', color: 'bg-yellow-400' },
  grass: { name: 'Grass', color: 'bg-green-500' },
  ice: { name: 'Ice', color: 'bg-blue-200' },
  fighting: { name: 'Fighting', color: 'bg-red-700' },
  poison: { name: 'Poison', color: 'bg-purple-500' },
  ground: { name: 'Ground', color: 'bg-yellow-600' },
  flying: { name: 'Flying', color: 'bg-indigo-400' },
  psychic: { name: 'Psychic', color: 'bg-pink-500' },
  bug: { name: 'Bug', color: 'bg-green-400' },
  rock: { name: 'Rock', color: 'bg-yellow-800' },
  ghost: { name: 'Ghost', color: 'bg-purple-700' },
  dragon: { name: 'Dragon', color: 'bg-indigo-700' },
  dark: { name: 'Dark', color: 'bg-gray-800' },
  steel: { name: 'Steel', color: 'bg-gray-600' },
  fairy: { name: 'Fairy', color: 'bg-pink-300' },
};

// Minimal representation for evolution chain display
export interface EvolutionPokemonInfo {
  name: string;
  id: number;
  spriteUrl: string;
}

export interface EvolutionDetail {
  item: { name: string; url: string } | null;
  trigger: { name: string; url: string };
  gender: number | null;
  held_item: { name: string; url: string } | null;
  known_move: { name: string; url: string } | null;
  known_move_type: { name: string; url: string } | null;
  location: { name: string; url: string } | null;
  min_affection: number | null;
  min_beauty: number | null;
  min_happiness: number | null;
  min_level: number | null;
  needs_overworld_rain: boolean;
  party_species: { name: string; url: string } | null;
  party_type: { name: string; url: string } | null;
  relative_physical_stats: number | null;
  time_of_day: string;
  trade_species: { name: string; url: string } | null;
  turn_upside_down: boolean;
}

export interface EvolutionLink {
  evolution_details: EvolutionDetail[];
  evolves_to: EvolutionLink[];
  species: { name: string; url: string };
  pokemonInfo?: EvolutionPokemonInfo; // To be populated by service
}

export interface EvolutionChain {
  id: number;
  baby_trigger_item: { name: string; url: string } | null;
  chain: EvolutionLink;
}

export interface PokemonSpecies {
  id: number;
  name: string;
  order: number;
  gender_rate: number;
  capture_rate: number;
  base_happiness: number;
  is_baby: boolean;
  is_legendary: boolean;
  is_mythical: boolean;
  hatch_counter: number;
  has_gender_differences: boolean;
  forms_switchable: boolean;
  growth_rate: { name: string; url: string };
  pokedex_numbers: Array<{
    entry_number: number;
    pokedex: { name: string; url: string };
  }>;
  egg_groups: Array<{ name: string; url: string }>;
  color: { name: string; url: string };
  shape: { name: string; url: string };
  evolves_from_species: { name: string; url: string } | null;
  evolution_chain: { url: string }; // URL to the EvolutionChain
  habitat: { name: string; url: string } | null;
  generation: { name: string; url: string };
  names: Array<{ name: string; language: { name: string; url: string } }>;
  flavor_text_entries: Array<{
    flavor_text: string;
    language: { name: string; url: string };
    version: { name: string; url: string };
  }>;
  form_descriptions: Array<{
    description: string;
    language: { name: string; url: string };
  }>;
  genera: Array<{ genus: string; language: { name: string; url: string } }>;
  varieties: Array<{
    is_default: boolean;
    pokemon: { name: string; url: string };
  }>;
}

export interface MoveEffectEntry {
  effect: string;
  short_effect: string;
  language: { name: string; url: string };
}

export interface MoveFlavorTextEntry {
  flavor_text: string;
  language: { name: string; url: string };
  version_group: { name: string; url: string };
}

export interface MoveMetaData {
  ailment: { name: string; url: string } | null;
  category: { name: string; url: string }; // e.g., "damage+lower"
  min_hits: number | null;
  max_hits: number | null;
  min_turns: number | null;
  max_turns: number | null;
  drain: number;
  healing: number;
  crit_rate: number;
  ailment_chance: number;
  flinch_chance: number;
  stat_chance: number;
}

export interface MoveDetails {
  id: number;
  name: string;
  accuracy: number | null;
  effect_chance: number | null;
  pp: number | null;
  priority: number;
  power: number | null;
  contest_combos: any | null; // Define further if needed
  contest_type: { name: string; url: string } | null;
  contest_effect: { url: string } | null;
  damage_class: { name: string; url: string }; // e.g., "physical", "special", "status"
  effect_entries: MoveEffectEntry[];
  effect_changes: any[]; // Define further if needed
  flavor_text_entries: MoveFlavorTextEntry[];
  generation: { name: string; url: string };
  machines: Array<{
    machine: { url: string };
    version_group: { name: string; url: string };
  }>; // TM/HM info
  meta: MoveMetaData | null;
  past_values: any[]; // Define further if needed for stat changes across generations
  stat_changes: Array<{ change: number; stat: { name: string; url: string } }>;
  super_contest_effect: { url: string } | null;
  target: { name: string; url: string };
  type: { name: string; url: string };
  learned_by_pokemon: Array<{ name: string; url: string }>; // List of Pokemon that learn this move
}

export interface TypeRelation {
  name: string;
  url: string;
}

export interface TypeDamageRelations {
  no_damage_to: TypeRelation[];
  half_damage_to: TypeRelation[];
  double_damage_to: TypeRelation[];
  no_damage_from: TypeRelation[];
  half_damage_from: TypeRelation[];
  double_damage_from: TypeRelation[];
}

export interface TypeGameIndex {
  game_index: number;
  generation: { name: string; url: string };
}

export interface TypePokemon {
  slot: number;
  pokemon: { name: string; url: string };
}

export interface TypeData {
  id: number;
  name: string;
  damage_relations: TypeDamageRelations;
  past_damage_relations?: Array<{
    generation: TypeRelation;
    damage_relations: TypeDamageRelations;
  }>;
  game_indices: TypeGameIndex[];
  generation: { name: string; url: string };
  move_damage_class: { name: string; url: string } | null;
  names: Array<{ name: string; language: { name: string; url: string } }>;
  pokemon: TypePokemon[];
  moves: Array<{ name: string; url: string }>;
}

export interface TypeListItem {
  name: string;
  url: string;
}
