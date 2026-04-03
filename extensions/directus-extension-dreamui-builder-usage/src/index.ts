import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';
import OptionsComponent from './options.vue';

export default defineInterface({
  id: 'dreamui-builder-usage',
  name: 'DreamUI Builder Usage',
  icon: 'account_tree',
  description: 'Show which pages use the current block through a Builder many-to-any relation',
  component: InterfaceComponent,
  types: ['alias'],
  group: 'presentation',
  options: OptionsComponent,
});
