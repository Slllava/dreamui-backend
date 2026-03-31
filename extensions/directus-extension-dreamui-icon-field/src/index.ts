import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
  id: 'dreamui-icon-field',
  name: 'DreamUI Icons',
  icon: 'imagesearch_roller',
  description: 'Pick Lucide and Remix Icon icons in one field',
  component: InterfaceComponent,
  types: ['string'],
  group: 'selection',
  options: null,
});
