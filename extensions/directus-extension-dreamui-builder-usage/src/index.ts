import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
  id: 'dreamui-builder-usage',
  name: 'DreamUI Builder Usage',
  icon: 'account_tree',
  description: 'Show which pages use the current block through a Builder many-to-any relation',
  component: InterfaceComponent,
  types: ['alias'],
  group: 'presentation',
  options: [
    {
      field: 'junctionCollection',
      name: 'Junction Collection',
      type: 'string',
      meta: {
        width: 'half',
        interface: 'input',
        note: 'Collection that stores Builder rows, for example pages_builder or pages_blocks',
      },
      schema: {
        default_value: 'pages_builder',
      },
    },
    {
      field: 'pageCollection',
      name: 'Page Collection',
      type: 'string',
      meta: {
        width: 'half',
        interface: 'input',
        note: 'Collection that represents pages',
      },
      schema: {
        default_value: 'pages',
      },
    },
    {
      field: 'junctionPageField',
      name: 'Junction Page Field',
      type: 'string',
      meta: {
        width: 'half',
        interface: 'input',
        note: 'M2O field on the junction row that points to the page',
      },
      schema: {
        default_value: 'pages_id',
      },
    },
    {
      field: 'junctionItemField',
      name: 'Junction Item Field',
      type: 'string',
      meta: {
        width: 'half',
        interface: 'input',
        note: 'Field on the junction row that stores the linked block id',
      },
      schema: {
        default_value: 'item',
      },
    },
    {
      field: 'junctionItemCollectionField',
      name: 'Junction Item Collection Field',
      type: 'string',
      meta: {
        width: 'half',
        interface: 'input',
        note: 'Field on the junction row that stores the linked block collection name',
      },
      schema: {
        default_value: 'collection',
      },
    },
    {
      field: 'currentCollectionOverride',
      name: 'Current Collection Override',
      type: 'string',
      meta: {
        width: 'half',
        interface: 'input',
        note: 'Optional. Use only if the current block collection name must be forced manually',
      },
    },
    {
      field: 'pageTitleField',
      name: 'Page Title Field',
      type: 'string',
      meta: {
        width: 'half',
        interface: 'input',
        note: 'Field to show as the main page label',
      },
      schema: {
        default_value: 'title',
      },
    },
    {
      field: 'pageSlugField',
      name: 'Page Slug Field',
      type: 'string',
      meta: {
        width: 'half',
        interface: 'input',
        note: 'Optional secondary field like slug, permalink, or path',
      },
      schema: {
        default_value: 'slug',
      },
    },
    {
      field: 'pageStatusField',
      name: 'Page Status Field',
      type: 'string',
      meta: {
        width: 'half',
        interface: 'input',
        note: 'Optional status field to display on each linked page',
      },
      schema: {
        default_value: 'status',
      },
    },
    {
      field: 'sortField',
      name: 'Sort Field',
      type: 'string',
      meta: {
        width: 'half',
        interface: 'input',
        note: 'Optional. Sort linked pages by a field on the page relation, for example title or sort',
      },
      schema: {
        default_value: 'title',
      },
    },
  ],
});
