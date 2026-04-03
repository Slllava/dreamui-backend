<template>
  <div class="dreamui-builder-options">
    <VNotice v-if="loadError" type="warning">
      {{ loadError }}
    </VNotice>

    <div v-if="loading" class="dreamui-builder-options__state">
      <VIcon name="hourglass_top" />
      <span>Loading collections and fields...</span>
    </div>

    <template v-else>
      <div class="dreamui-builder-options__grid">
        <div class="dreamui-builder-options__field">
          <span class="dreamui-builder-options__label">Builder Collection</span>
          <VSelect
            :model-value="draft.junctionCollection"
            :items="collectionItems"
            item-text="text"
            item-value="value"
            @update:model-value="onCollectionChange('junctionCollection', $event)"
          />
          <small class="dreamui-builder-options__hint">Collection that stores rows linking pages to blocks</small>
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
          <span class="dreamui-builder-options__label">Page Relation Field</span>
          <VSelect
            :model-value="draft.junctionPageField"
            :items="junctionFieldItems"
            item-text="text"
            item-value="value"
            @update:model-value="updateField('junctionPageField', $event)"
          />
          <small class="dreamui-builder-options__hint">Field in the Builder collection that points to the page</small>
        </div>

        <div class="dreamui-builder-options__field">
          <span class="dreamui-builder-options__label">Detected Mapping</span>
          <div class="dreamui-builder-options__summary">
            <div><strong>Block ID field:</strong> {{ draft.junctionItemField || 'Not detected' }}</div>
            <div><strong>Block collection field:</strong> {{ draft.junctionItemCollectionField || 'None' }}</div>
            <div><strong>Page title field:</strong> {{ draft.pageTitleField || 'Not detected' }}</div>
            <div><strong>Page slug field:</strong> {{ draft.pageSlugField || 'None' }}</div>
            <div><strong>Page status field:</strong> {{ draft.pageStatusField || 'None' }}</div>
            <div><strong>Sort field:</strong> {{ draft.sortField || 'None' }}</div>
          </div>
          <small class="dreamui-builder-options__hint">These values are auto-filled. Open advanced settings only if something looks wrong.</small>
        </div>
      </div>

      <div class="dreamui-builder-options__advanced-toggle">
        <VButton secondary small @click="showAdvanced = !showAdvanced">
          <VIcon :name="showAdvanced ? 'expand_less' : 'expand_more'" left />
          {{ showAdvanced ? 'Hide advanced settings' : 'Show advanced settings' }}
        </VButton>
      </div>

      <div v-if="showAdvanced" class="dreamui-builder-options__grid">
        <div class="dreamui-builder-options__field">
          <span class="dreamui-builder-options__label">Block ID Field</span>
          <VSelect
            :model-value="draft.junctionItemField"
            :items="junctionFieldItems"
            item-text="text"
            item-value="value"
            @update:model-value="updateField('junctionItemField', $event)"
          />
        </div>

        <div class="dreamui-builder-options__field">
          <span class="dreamui-builder-options__label">Block Collection Field</span>
          <VSelect
            :model-value="draft.junctionItemCollectionField"
            :items="optionalJunctionFieldItems"
            item-text="text"
            item-value="value"
            @update:model-value="updateField('junctionItemCollectionField', $event)"
          />
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
        </div>
      </div>
    </template>
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
    junctionItemCollectionField: normalizeString(input.junctionItemCollectionField, DEFAULTS.junctionItemCollectionField),
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
    const showAdvanced = ref(false);
    const draft = ref<OptionValue>(normalizeValue(props.value));
    const collections = ref<SelectItem[]>([]);
    const fieldsByCollection = ref<Record<string, SelectItem[]>>({});

    const collectionItems = computed(() => collections.value);
    const optionalCollectionItems = computed(() => [{ text: 'None', value: '' }, ...collections.value]);
    const junctionFieldItems = computed(() => fieldsByCollection.value[draft.value.junctionCollection] ?? []);
    const optionalJunctionFieldItems = computed(() => [{ text: 'None', value: '' }, ...junctionFieldItems.value]);
    const pageFieldItems = computed(() => fieldsByCollection.value[draft.value.pageCollection] ?? []);
    const optionalPageFieldItems = computed(() => [{ text: 'None', value: '' }, ...pageFieldItems.value]);

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

    function pickField(items: SelectItem[], candidates: string[], fallback = ''): string {
      for (const candidate of candidates) {
        const match = items.find((item) => item.value === candidate);
        if (match) return match.value;
      }

      return fallback;
    }

    function autoDetectJunctionFields() {
      const fields = fieldsByCollection.value[draft.value.junctionCollection] ?? [];
      const pageField = pickField(
        fields,
        ['parent_page', 'page', 'pages_id', 'page_id', 'pages', 'parent'],
        draft.value.junctionPageField,
      );

      draft.value.junctionPageField = pageField;
      draft.value.junctionItemField = pickField(
        fields,
        ['item', 'block', 'block_id', 'collection_item', 'related_item'],
        fields.find((item) => item.value !== pageField)?.value ?? draft.value.junctionItemField,
      );
      draft.value.junctionItemCollectionField = pickField(
        fields,
        ['collection', 'item_collection', 'block_collection', 'related_collection'],
        '',
      );
    }

    function autoDetectPageFields() {
      const fields = fieldsByCollection.value[draft.value.pageCollection] ?? [];

      draft.value.pageTitleField = pickField(fields, ['title', 'name', 'headline', 'label'], draft.value.pageTitleField);
      draft.value.pageSlugField = pickField(fields, ['slug', 'permalink', 'path', 'url'], '');
      draft.value.pageStatusField = pickField(fields, ['status', 'state'], '');
      draft.value.sortField = pickField(fields, ['title', 'sort', 'date_created', 'published_at'], draft.value.pageTitleField);
    }

    function onCollectionChange(field: 'junctionCollection' | 'pageCollection', value: string | number | null) {
      const normalizedValue = typeof value === 'string' ? value : '';
      draft.value[field] = normalizedValue;

      if (field === 'junctionCollection') {
        autoDetectJunctionFields();
      }

      if (field === 'pageCollection') {
        autoDetectPageFields();
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
            fields: 'collection,meta.hidden',
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

        autoDetectJunctionFields();
        autoDetectPageFields();
        emitDraft();
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
      optionalJunctionFieldItems,
      optionalPageFieldItems,
      pageFieldItems,
      showAdvanced,
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

.dreamui-builder-options__summary {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 0.875rem 1rem;
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
  background: var(--theme--background-page);
  color: var(--theme--foreground-subdued);
  font-size: 0.875rem;
}

.dreamui-builder-options__advanced-toggle {
  display: flex;
  justify-content: flex-start;
}
</style>
