import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  imports: [],
  template: `
    <div class="text-center mb-8">
      <h1 class="text-4xl md:text-6xl font-bold text-gray-800 mb-2">Pokédex</h1>
      <p class="text-lg text-gray-600">
        Discover and explore Pokémon from all the regions!
      </p>
    </div>
  `,
  styles: ``,
})
export class HeaderComponent {}
