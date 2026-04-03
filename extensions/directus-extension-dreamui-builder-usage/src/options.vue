<template>
  <div class="dreamui-builder-options">
    <VNotice v-if="loadError" type="warning">
      {{ loadError }}
    </VNotice>

    <div v-if="loading" class="dreamui-builder-options__state">
      <VIcon name="hourglass_top" />
      <span>Loading collections and fields...</span>
    </div>

    <div v-else class="dreamui-builder-options__grid">
      <div class="dreamui-builder-options__field">
        <span class="dreamui-builder-options__label">Junction Collection</span>
        <VSelect
          :model-value="draft.junctionCollection"
          :items="collectionItems"
          item-text="text"
          item-value="value"
          @update:model-value="onCollectionChange('junctionCollection', $event)"
        />
        <small class="dreamui-builder-options__hint">Collection that stores Builder rows</small>
      </div>

      <div class="dreamui-builder-options__field">
        <span class="dreamui-builder-options__label">Page Collection</span>
        <VSelect
          :model-value="draft.pageCollection"
          :items="collectionItems"
          item-text="text"
          item-value="value"
          @update:model-value="onCollectionChange('pageCollection', $event)"
        />
        <small class="dreamui-builder-options__hint">Collection that represents pages</small>
      </div>

      <div class="dreamui-builder-options__field">
        <span class="dreamui-builder-options__label">Junction Page Field</span>
        <VSelect
          :model-value="draft.junctionPageField"
          :items="junctionFieldItems"
          item-text="text"
          item-value="value"
          @update:model-value="updateField('junctionPageField', $event)"
        />
        <small class="dreamui-builder-options__hint">M2O field on the junction row that points to the page</small>
      </div>

      <div class="dreamui-builder-options__field">
        <span class="dreamui-builder-options__label">Junction Item Field</span>
        <VSelect
          :model-value="draft.junctionItemField"
          :items="junctionFieldItems"
          item-text="text"
          item-value="value"
          @update:model-value="updateField('junctionItemField', $event)"
        />
        <small class="dreamui-builder-options__hint">Field on the junction row that stores the linked block id</small>
      </div>

      <div class="dreamui-builder-options__field">
        <span class="dreamui-builder-options__label">Junction Item Collection Field</span>
        <VSelect
          :model-value="draft.junctionItemCollectionField"
          :items="junctionFieldItems"
          item-text="text"
          item-value="value"
          @update:model-value="updateField('junctionItemCollectionField', $event)"
        />
        <small class="dreamui-builder-options__hint">Field on the junction row that stores the block collection name</small>
      </div>

      <div class="dreamui-builder-options__field">
        <span class="dreamui-builder-options__label">Current Collection Override</span>
        <VSelect
          :model-value="draft.currentCollectionOverride"
          :items="optionalCollectionItems"
          item-text="text"
          item-value="value"
          @update:model-value="updateField('currentCollectionOverride', $event)"
        />
        <small class="dreamui-builder-options__hint">Optional override for the current block collection</small>
      </div>

      <div class="dreamui-builder-options__field">
        <span class="dreamui-builder-options__label">Page Title Field</span>
        <VSelect
          :model-value="draft.pageTitleField"
          :items="pageFieldItems"
          item-text="text"
          item-value="value"
          @update:model-value="updateField('pageTitleField', $event)"
        />
        <small class="dreamui-builder-options__hint">Field to show as the main page label</small>
      </div>

      <div class="dreamui-builder-options__field">
        <span class="dreamui-builder-options__label">Page Slug Field</span>
        <VSelect
          :model-value="draft.pageSlugField"
          :items="optionalPageFieldItems"
          item-text="text"
          item-value="value"
          @update:model-value="updateField('pageSlugField', $event)"
        />
        <small class="dreamui-builder-options__hint">Optional secondary field like slug, permalink, or path</small>
      </div>

      <div class="dreamui-builder-options__field">
        <span class="dreamui-builder-options__label">Page Status Field</span>
        <VSelect
          :model-value="draft.pageStatusField"
          :items="optionalPageFieldItems"
          item-text="text"
          item-value="value"
          @update:model-value="updateField('pageStatusField', $event)"
        />
        <small class="dreamui-builder-options__hint">Optional status field to display on each linked page</small>
      </div>

      <div class="dreamui-builder-options__field">
        <span class="dreamui-builder-options__label">Sort Field</span>
        <VSelect
          :model-value="draft.sortField"
          :items="optionalPageFieldItems"
          item-text="text"
          item-value="value"
          @update:model-value="updateField('sortField', $event)"
        />
        <small class="dreamui-builder-options__hint">Optional field used to sort linked pages</small>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { useApi } from '@directus/extensions-sdk';
import { computed, defineComponent, onMounted, ref, watch } from 'vue';

type OptionValue = {
  junctionCollection: string;
  pageCollection: string;
  junctionPageField: string;
  junctionItemField: string;
  junctionItemCollectionField: string;
  currentCollectionOverride: string;
  pageTitleField: string;
  pageSlugField: string;
  pageStatusField: string;
  sortField: string;
};

type SelectItem = {
  text: string;
  value: string;
};

type DirectusField = {
  field?: string;
  meta?: {
    hidden?: boolean;
  } | null;
};

const DEFAULTS: OptionValue = {
  junctionCollection: 'pages_builder',
  pageCollection: 'pages',
  junctionPageField: 'pages_id',
  junctionItemField: 'item',
  junctionItemCollectionField: 'collection',
  currentCollectionOverride: '',
  pageTitleField: 'title',
  pageSlugField: 'slug',
  pageStatusField: 'status',
  sortField: 'title',
};

function normalizeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function normalizeValue(value: unknown): OptionValue {
  const input = value && typeof value === 'object' ? (value as Partial<OptionValue>) : {};

  return {
    junctionCollection: normalizeString(input.junctionCollection, DEFAULTS.junctionCollection),
    pageCollection: normalizeString(input.pageCollection, DEFAULTS.pageCollection),
    junctionPageField: normalizeString(input.junctionPageField, DEFAULTS.junctionPageField),
    junctionItemField: normalizeString(input.junctionItemField, DEFAULTS.junctionItemField),
    junctionItemCollectionField: normalizeString(
      input.junctionItemCollectionField,
      DEFAULTS.junctionItemCollectionField,
    ),
    currentCollectionOverride: normalizeString(input.currentCollectionOverride),
    pageTitleField: normalizeString(input.pageTitleField, DEFAULTS.pageTitleField),
    pageSlugField: normalizeString(input.pageSlugField, DEFAULTS.pageSlugField),
    pageStatusField: normalizeString(input.pageStatusField, DEFAULTS.pageStatusField),
    sortField: normalizeString(input.sortField, DEFAULTS.sortField),
  };
}

export default defineComponent({
  props: {
    value: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ['input'],
  setup(props, { emit }) {
    const api = useApi();
    const loading = ref(false);
    const loadError = ref('');
    const draft = ref<OptionValue>(normalizeValue(props.value));
    const collections = ref<SelectItem[]>([]);
    const fieldsByCollection = ref<Record<string, SelectItem[]>>({});

    const collectionItems = computed(() => collections.value);
    const optionalCollectionItems = computed(() => [{ text: 'None', value: '' }, ...collections.value]);

    const junctionFieldItems = computed(() => {
      return fieldsByCollection.value[draft.value.junctionCollection] ?? [];
    });

    const pageFieldItems = computed(() => {
      return fieldsByCollection.value[draft.value.pageCollection] ?? [];
    });

    const optionalPageFieldItems = computed(() => {
      return [{ text: 'None', value: '' }, ...pageFieldItems.value];
    });

    watch(
      () => props.value,
      (value) => {
        draft.value = normalizeValue(value);
      },
    );

    function emitDraft() {
      emit('input', { ...draft.value });
    }

    function updateField(field: keyof OptionValue, value: string | number | null) {
      draft.value[field] = typeof value === 'string' ? value : '';
      emitDraft();
    }

    function getFirstAvailableField(items: SelectItem[], preferred: string) {
      if (items.some((item) => item.value === preferred)) return preferred;
      return items[0]?.value ?? '';
    }

    function onCollectionChange(field: 'junctionCollection' | 'pageCollection', value: string | number | null) {
      const normalizedValue = typeof value === 'string' ? value : '';
      draft.value[field] = normalizedValue;

      if (field === 'junctionCollection') {
        const fields = fieldsByCollection.value[normalizedValue] ?? [];
        draft.value.junctionPageField = getFirstAvailableField(fields, draft.value.junctionPageField || DEFAULTS.junctionPageField);
        draft.value.junctionItemField = getFirstAvailableField(fields, draft.value.junctionItemField || DEFAULTS.junctionItemField);
        draft.value.junctionItemCollectionField = getFirstAvailableField(
          fields,
          draft.value.junctionItemCollectionField || DEFAULTS.junctionItemCollectionField,
        );
      }

      if (field === 'pageCollection') {
        const fields = fieldsByCollection.value[normalizedValue] ?? [];
        draft.value.pageTitleField = getFirstAvailableField(fields, draft.value.pageTitleField || DEFAULTS.pageTitleField);
        draft.value.pageSlugField = fields.some((item) => item.value === draft.value.pageSlugField)
          ? draft.value.pageSlugField
          : '';
        draft.value.pageStatusField = fields.some((item) => item.value === draft.value.pageStatusField)
          ? draft.value.pageStatusField
          : '';
        draft.value.sortField = fields.some((item) => item.value === draft.value.sortField)
          ? draft.value.sortField
          : draft.value.pageTitleField;
      }

      emitDraft();
    }

    async function loadCollectionsAndFields() {
      loading.value = true;
      loadError.value = '';

      try {
        const collectionsResponse = await api.get('/collections', {
          params: {
            limit: -1,
            fields: 'collection,meta.icon,meta.hidden',
          },
        });

        const collectionRows = Array.isArray(collectionsResponse.data?.data) ? collectionsResponse.data.data : [];
        const availableCollections = collectionRows
          .filter((item: Record<string, any>) => item?.collection && item?.meta?.hidden !== true)
          .map((item: Record<string, any>) => ({
            text: String(item.collection),
            value: String(item.collection),
          }))
          .sort((a: SelectItem, b: SelectItem) => a.text.localeCompare(b.text));

        collections.value = availableCollections;

        const fieldsMap: Record<string, SelectItem[]> = {};

        await Promise.all(
          availableCollections.map(async (collection) => {
            try {
              const response = await api.get(`/fields/${collection.value}`);
              const rows = Array.isArray(response.data?.data) ? response.data.data : [];

              fieldsMap[collection.value] = rows
                .filter((field: DirectusField) => field?.field && field?.meta?.hidden !== true)
                .map((field: DirectusField) => ({
                  text: String(field.field),
                  value: String(field.field),
                }))
                .sort((a, b) => a.text.localeCompare(b.text));
            } catch {
              fieldsMap[collection.value] = [];
            }
          }),
        );

        fieldsByCollection.value = fieldsMap;

        if (!availableCollections.some((item) => item.value === draft.value.junctionCollection)) {
          draft.value.junctionCollection = availableCollections[0]?.value ?? '';
        }

        if (!availableCollections.some((item) => item.value === draft.value.pageCollection)) {
          draft.value.pageCollection = availableCollections[0]?.value ?? '';
        }

        onCollectionChange('junctionCollection', draft.value.junctionCollection);
        onCollectionChange('pageCollection', draft.value.pageCollection);
      } catch (error) {
        loadError.value =
          error instanceof Error ? error.message : 'Failed to load collections and fields for the options editor.';
      } finally {
        loading.value = false;
      }
    }

    onMounted(() => {
      loadCollectionsAndFields();
    });

    return {
      collectionItems,
      draft,
      junctionFieldItems,
      loadError,
      loading,
      onCollectionChange,
      optionalCollectionItems,
      optionalPageFieldItems,
      pageFieldItems,
      updateField,
    };
  },
});
</script>

<style scoped>
.dreamui-builder-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dreamui-builder-options__state {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  color: var(--theme--foreground-subdued);
}

.dreamui-builder-options__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 1rem;
}

.dreamui-builder-options__field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dreamui-builder-options__label {
  color: var(--theme--foreground);
  font-size: 0.875rem;
  font-weight: 700;
}

.dreamui-builder-options__hint {
  color: var(--theme--foreground-subdued);
  font-size: 0.75rem;
}
</style>
