<template>
  <div class="dreamui-builder-usage">
    <div class="dreamui-builder-usage__header">
      <div>
        <div class="dreamui-builder-usage__title">Used on pages</div>
        <div class="dreamui-builder-usage__hint">Read-only list of pages that reference this block through Builder M2A</div>
      </div>

      <VButton secondary small :disabled="isRefreshDisabled" @click="loadUsage">
        <VIcon name="refresh" left />
        Refresh
      </VButton>
    </div>

    <VNotice v-if="!primaryKey" type="info">
      Save this block first, then the extension will show which pages use it.
    </VNotice>

    <VNotice v-else-if="configError" type="warning">
      {{ configError }}
    </VNotice>

    <VNotice v-else-if="errorMessage" type="warning">
      {{ errorMessage }}
    </VNotice>

    <div v-else-if="loading" class="dreamui-builder-usage__state">
      <VIcon name="hourglass_top" />
      <span>Loading linked pages...</span>
    </div>

    <div v-else-if="pages.length === 0" class="dreamui-builder-usage__empty">
      No linked pages found for this block.
    </div>

    <div v-else class="dreamui-builder-usage__list">
      <article v-for="page in pages" :key="page.id" class="dreamui-builder-usage__card">
        <div class="dreamui-builder-usage__card-main">
          <div class="dreamui-builder-usage__page-title">{{ page.title }}</div>
          <div v-if="page.meta" class="dreamui-builder-usage__page-meta">{{ page.meta }}</div>
        </div>

        <div v-if="page.status" class="dreamui-builder-usage__status">
          {{ page.status }}
        </div>
      </article>
    </div>
  </div>
</template>

<script lang="ts">
import { useApi } from '@directus/extensions-sdk';
import { computed, defineComponent, onMounted, ref, watch } from 'vue';

type DirectusField = {
  collection?: string | null;
  field?: string;
  meta?: {
    options?: Record<string, unknown> | null;
  } | null;
};

type UsagePage = {
  id: string;
  title: string;
  meta: string;
  status: string;
};

type InterfaceOptions = {
  junctionCollection?: string;
  pageCollection?: string;
  junctionPageField?: string;
  junctionItemField?: string;
  junctionItemCollectionField?: string;
  currentCollectionOverride?: string;
  pageTitleField?: string;
  pageSlugField?: string;
  pageStatusField?: string;
  sortField?: string;
};

function normalizeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function stringifyPrimaryKey(value: unknown): string {
  if (value === null || value === undefined) return '';

  return String(value).trim();
}

export default defineComponent({
  props: {
    value: {
      type: null,
      default: null,
    },
    field: {
      type: Object,
      default: null,
    },
    primaryKey: {
      type: [String, Number],
      default: null,
    },
  },
  setup(props) {
    const api = useApi();
    const loading = ref(false);
    const errorMessage = ref('');
    const pages = ref<UsagePage[]>([]);

    const options = computed<InterfaceOptions>(() => {
      return ((props.field as DirectusField | null)?.meta?.options ?? {}) as InterfaceOptions;
    });

    const currentCollection = computed(() => {
      return normalizeString(options.value.currentCollectionOverride, normalizeString((props.field as DirectusField | null)?.collection));
    });

    const normalizedPrimaryKey = computed(() => stringifyPrimaryKey(props.primaryKey));

    const resolvedConfig = computed(() => {
      return {
        junctionCollection: normalizeString(options.value.junctionCollection, 'pages_builder'),
        pageCollection: normalizeString(options.value.pageCollection, 'pages'),
        junctionPageField: normalizeString(options.value.junctionPageField, 'pages_id'),
        junctionItemField: normalizeString(options.value.junctionItemField, 'item'),
        junctionItemCollectionField: normalizeString(options.value.junctionItemCollectionField, 'collection'),
        pageTitleField: normalizeString(options.value.pageTitleField, 'title'),
        pageSlugField: normalizeString(options.value.pageSlugField, 'slug'),
        pageStatusField: normalizeString(options.value.pageStatusField, 'status'),
        sortField: normalizeString(options.value.sortField, 'title'),
      };
    });

    const configError = computed(() => {
      if (!currentCollection.value) {
        return 'Cannot detect the current block collection. Set "Current Collection Override" in the interface options.';
      }

      if (!resolvedConfig.value.junctionCollection) {
        return 'Set the junction collection name in the interface options.';
      }

      if (!resolvedConfig.value.junctionPageField) {
        return 'Set the junction page field in the interface options.';
      }

      return '';
    });

    const isRefreshDisabled = computed(() => {
      return loading.value || !normalizedPrimaryKey.value || Boolean(configError.value);
    });

    async function loadUsage() {
      if (!normalizedPrimaryKey.value || configError.value) {
        pages.value = [];
        errorMessage.value = '';
        return;
      }

      loading.value = true;
      errorMessage.value = '';

      try {
        const config = resolvedConfig.value;
        const requestedFields = [
          'id',
          `${config.junctionPageField}.id`,
          `${config.junctionPageField}.${config.pageTitleField}`,
          `${config.junctionPageField}.${config.pageSlugField}`,
          `${config.junctionPageField}.${config.pageStatusField}`,
        ];

        const response = await api.get(`/items/${config.junctionCollection}`, {
          params: {
            fields: Array.from(new Set(requestedFields)).join(','),
            filter: {
              [config.junctionItemCollectionField]: {
                _eq: currentCollection.value,
              },
              [config.junctionItemField]: {
                _eq: normalizedPrimaryKey.value,
              },
              [config.junctionPageField]: {
                _nnull: true,
              },
            },
            sort: `${config.junctionPageField}.${config.sortField}`,
            limit: -1,
          },
        });

        const items = Array.isArray(response.data?.data) ? response.data.data : [];
        const deduped = new Map<string, UsagePage>();

        for (const row of items) {
          const relatedPage = row?.[config.junctionPageField];

          if (!relatedPage || typeof relatedPage !== 'object') continue;

          const id = stringifyPrimaryKey(relatedPage.id);

          if (!id) continue;

          const title =
            normalizeString(relatedPage[config.pageTitleField]) ||
            normalizeString(relatedPage[config.pageSlugField]) ||
            `${config.pageCollection} #${id}`;
          const meta = normalizeString(relatedPage[config.pageSlugField]);
          const status = normalizeString(relatedPage[config.pageStatusField]);

          deduped.set(id, {
            id,
            title,
            meta,
            status,
          });
        }

        pages.value = Array.from(deduped.values()).sort((a, b) => a.title.localeCompare(b.title));
      } catch (error) {
        pages.value = [];
        errorMessage.value =
          error instanceof Error
            ? error.message
            : 'Failed to load linked pages. Check the collection and field names in the interface options.';
      } finally {
        loading.value = false;
      }
    }

    watch(
      () => [props.primaryKey, currentCollection.value, JSON.stringify(options.value)],
      () => {
        loadUsage();
      },
    );

    onMounted(() => {
      loadUsage();
    });

    return {
      configError,
      errorMessage,
      isRefreshDisabled,
      loadUsage,
      loading,
      pages,
      primaryKey: normalizedPrimaryKey,
    };
  },
});
</script>

<style scoped>
.dreamui-builder-usage {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dreamui-builder-usage__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.dreamui-builder-usage__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--theme--foreground);
}

.dreamui-builder-usage__hint {
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  color: var(--theme--foreground-subdued);
}

.dreamui-builder-usage__state,
.dreamui-builder-usage__empty {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 1rem;
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
  color: var(--theme--foreground-subdued);
  background: var(--theme--background-page);
}

.dreamui-builder-usage__list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dreamui-builder-usage__card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.875rem 1rem;
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
  background: var(--theme--background-page);
}

.dreamui-builder-usage__card-main {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.1875rem;
}

.dreamui-builder-usage__page-title {
  color: var(--theme--foreground);
  font-weight: 600;
}

.dreamui-builder-usage__page-meta {
  color: var(--theme--foreground-subdued);
  font-size: 0.8125rem;
  word-break: break-word;
}

.dreamui-builder-usage__status {
  flex-shrink: 0;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  background: var(--theme--primary-background);
  color: var(--theme--primary);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

@media (max-width: 640px) {
  .dreamui-builder-usage__header,
  .dreamui-builder-usage__card {
    flex-direction: column;
    align-items: stretch;
  }

  .dreamui-builder-usage__status {
    align-self: flex-start;
  }
}
</style>
