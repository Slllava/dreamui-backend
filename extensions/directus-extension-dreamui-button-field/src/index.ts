import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
  id: 'dreamui-button-field',
  name: 'DreamUI Button',
  icon: 'smart_button',
  description: 'Edit button title, link, style, and optional icon in one field',
  component: InterfaceComponent,
  types: ['string'],
  group: 'selection',
  options: null,
});
