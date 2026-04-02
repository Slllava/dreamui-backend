<template>
  <div class="dreamui-button-field">
    <div class="dreamui-button-field__tabs" role="tablist" aria-label="Button settings sections">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="dreamui-button-field__tab"
        :class="{ active: activeTab === tab.value }"
        :aria-selected="activeTab === tab.value"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="activeTab === 'content'" class="dreamui-button-field__section">
      <div class="dreamui-button-field__section-header">
        <span class="dreamui-button-field__title">Content</span>
        <span class="dreamui-button-field__hint">Main button label and optional arrow icon</span>
      </div>

      <div class="dreamui-button-field__grid">
        <label class="dreamui-button-field__control">
          <span class="dreamui-button-field__label">Title</span>
          <VInput v-model="draft.title" placeholder="Learn more" @update:model-value="emitDraft" />
        </label>

        <label class="dreamui-button-field__control dreamui-button-field__control--checkbox">
          <span class="dreamui-button-field__label">Arrow icon</span>
          <VCheckbox
            :model-value="draft.hasArrowIcon"
            label="Show arrow icon"
            @update:model-value="onArrowIconToggle"
          />
        </label>
      </div>
    </div>

    <div v-if="activeTab === 'link'" class="dreamui-button-field__section">
      <div class="dreamui-button-field__section-header">
        <span class="dreamui-button-field__title">Link</span>
        <span class="dreamui-button-field__hint">Control how the button resolves its destination</span>
      </div>

      <div class="dreamui-button-field__grid">
        <label class="dreamui-button-field__control">
          <span class="dreamui-button-field__label">URL type</span>
          <VMenu v-model="urlTypeMenuActive" attached>
            <template #activator="{ active, toggle }">
              <VInput :model-value="selectedUrlTypeLabel" readonly @click="toggle">
                <template #append>
                  <VIcon clickable name="expand_more" class="open-indicator" :class="{ open: active }" @click="toggle" />
                </template>
              </VInput>
            </template>

            <div class="dreamui-select-popover">
              <button
                v-for="item in urlTypeItems"
                :key="item.value"
                type="button"
                class="dreamui-select-option"
                :class="{ active: item.value === draft.urlType }"
                @click="
                  () => {
                    draft.urlType = item.value;
                    urlTypeMenuActive = false;
                    emitDraft();
                  }
                "
              >
                <div class="dreamui-select-option__content">
                  <span>{{ item.text }}</span>
                  <span class="dreamui-select-option__note">{{ item.note }}</span>
                </div>
              </button>
            </div>
          </VMenu>
        </label>

        <label class="dreamui-button-field__control">
          <span class="dreamui-button-field__label">Target</span>
          <VMenu v-model="targetMenuActive" attached>
            <template #activator="{ active, toggle }">
              <VInput :model-value="selectedTargetLabel" readonly @click="toggle">
                <template #append>
                  <VIcon clickable name="expand_more" class="open-indicator" :class="{ open: active }" @click="toggle" />
                </template>
              </VInput>
            </template>

            <div class="dreamui-select-popover">
              <button
                v-for="item in targetItems"
                :key="item.value"
                type="button"
                class="dreamui-select-option"
                :class="{ active: item.value === draft.target }"
                @click="
                  () => {
                    draft.target = item.value;
                    targetMenuActive = false;
                    emitDraft();
                  }
                "
              >
                <div class="dreamui-select-option__content">
                  <span>{{ item.text }}</span>
                  <span class="dreamui-select-option__note">{{ item.note }}</span>
                </div>
              </button>
            </div>
          </VMenu>
        </label>

        <div v-if="draft.urlType === 'url_page'" class="dreamui-button-field__control dreamui-button-field__control--full">
          <span class="dreamui-button-field__label">Page</span>

          <VMenu v-if="pagesCollectionExists" v-model="pageMenuActive" attached>
            <template #activator="{ active, toggle }">
              <VInput
                :model-value="pageSearchQuery || selectedPageLabel"
                :placeholder="pagesLoading ? 'Loading pages...' : 'Choose a page...'"
                @click="toggle"
                @update:model-value="onPageSearchInput"
              >
                <template #append>
                  <VIcon clickable name="expand_more" class="open-indicator" :class="{ open: active }" @click="toggle" />
                </template>
              </VInput>
            </template>

            <div class="dreamui-select-popover dreamui-select-popover--pages">
              <div v-if="pagesLoading" class="dreamui-button-field__empty">Loading pages...</div>
              <div v-else-if="filteredPageOptions.length === 0" class="dreamui-button-field__empty">No pages found</div>

              <button
                v-for="item in filteredPageOptions"
                v-else
                :key="item.value"
                type="button"
                class="dreamui-select-option"
                :class="{ active: item.value === draft.page }"
                @click="
                  () => {
                    draft.page = item.value;
                    pageSearchQuery = '';
                    pageMenuActive = false;
                    emitDraft();
                  }
                "
              >
                <div class="dreamui-select-option__content">
                  <span>{{ item.text }}</span>
                  <span v-if="item.note" class="dreamui-select-option__note">{{ item.note }}</span>
                </div>
              </button>
            </div>
          </VMenu>

          <VInput
            v-else
            v-model="draft.page"
            placeholder="/about"
            @update:model-value="emitDraft"
          />
        </div>

        <div v-if="draft.urlType === 'form'" class="dreamui-button-field__control dreamui-button-field__control--full">
          <span class="dreamui-button-field__label">Form</span>

          <VMenu v-if="formsCollectionExists" v-model="formMenuActive" attached>
            <template #activator="{ active, toggle }">
              <VInput
                :model-value="formSearchQuery || selectedFormLabel"
                :placeholder="formsLoading ? 'Loading forms...' : 'Choose a form...'"
                @click="toggle"
                @update:model-value="onFormSearchInput"
              >
                <template #append>
                  <VIcon clickable name="expand_more" class="open-indicator" :class="{ open: active }" @click="toggle" />
                </template>
              </VInput>
            </template>

            <div class="dreamui-select-popover dreamui-select-popover--pages">
              <div v-if="formsLoading" class="dreamui-button-field__empty">Loading forms...</div>
              <div v-else-if="filteredFormOptions.length === 0" class="dreamui-button-field__empty">No forms found</div>

              <button
                v-for="item in filteredFormOptions"
                v-else
                :key="item.value"
                type="button"
                class="dreamui-select-option"
                :class="{ active: item.value === draft.form }"
                @click="
                  () => {
                    draft.form = item.value;
                    formSearchQuery = '';
                    formMenuActive = false;
                    emitDraft();
                  }
                "
              >
                <div class="dreamui-select-option__content">
                  <span>{{ item.text }}</span>
                  <span v-if="item.note" class="dreamui-select-option__note">{{ item.note }}</span>
                </div>
              </button>
            </div>
          </VMenu>

          <VInput
            v-else
            v-model="draft.form"
            placeholder="contact-form"
            @update:model-value="emitDraft"
          />
        </div>

        <label v-if="draft.urlType === 'custom_url'" class="dreamui-button-field__control dreamui-button-field__control--full">
          <span class="dreamui-button-field__label">Custom URL</span>
          <VInput v-model="draft.customUrl" placeholder="https://example.com" @update:model-value="emitDraft" />
        </label>

        <label v-if="draft.urlType === 'url_other'" class="dreamui-button-field__control dreamui-button-field__control--full">
          <span class="dreamui-button-field__label">Preset route</span>
          <VMenu v-model="otherUrlMenuActive" attached>
            <template #activator="{ active, toggle }">
              <VInput :model-value="selectedOtherUrlLabel" readonly @click="toggle">
                <template #append>
                  <VIcon clickable name="expand_more" class="open-indicator" :class="{ open: active }" @click="toggle" />
                </template>
              </VInput>
            </template>

            <div class="dreamui-select-popover">
              <button
                v-for="item in otherUrlItems"
                :key="item.value"
                type="button"
                class="dreamui-select-option"
                :class="{ active: item.value === draft.otherUrl }"
                @click="
                  () => {
                    draft.otherUrl = item.value;
                    otherUrlMenuActive = false;
                    emitDraft();
                  }
                "
              >
                <div class="dreamui-select-option__content">
                  <span>{{ item.text }}</span>
                  <span class="dreamui-select-option__note">{{ item.note }}</span>
                </div>
              </button>
            </div>
          </VMenu>
        </label>
      </div>
    </div>

    <div v-if="activeTab === 'styles'" class="dreamui-button-field__section">
      <div class="dreamui-button-field__section-header">
        <span class="dreamui-button-field__title">Styles</span>
        <span class="dreamui-button-field__hint">Choose the visual style and accent color</span>
      </div>

      <div class="dreamui-button-field__grid">
        <label class="dreamui-button-field__control">
          <span class="dreamui-button-field__label">Style</span>
          <VMenu v-model="styleMenuActive" attached>
            <template #activator="{ active, toggle }">
              <VInput :model-value="selectedStyleLabel" readonly @click="toggle">
                <template #append>
                  <VIcon clickable name="expand_more" class="open-indicator" :class="{ open: active }" @click="toggle" />
                </template>
              </VInput>
            </template>

            <div class="dreamui-select-popover">
              <button
                v-for="item in styleItems"
                :key="item.value"
                type="button"
                class="dreamui-select-option"
                :class="{ active: item.value === draft.style }"
                @click="
                  () => {
                    draft.style = item.value;
                    styleMenuActive = false;
                    emitDraft();
                  }
                "
              >
                <div class="dreamui-select-option__content">
                  <span>{{ item.text }}</span>
                  <span class="dreamui-select-option__note">{{ item.note }}</span>
                </div>
              </button>
            </div>
          </VMenu>
        </label>

        <label class="dreamui-button-field__control">
          <span class="dreamui-button-field__label">Size</span>
          <VMenu v-model="sizeMenuActive" attached>
            <template #activator="{ active, toggle }">
              <VInput :model-value="selectedSizeLabel" readonly @click="toggle">
                <template #append>
                  <VIcon clickable name="expand_more" class="open-indicator" :class="{ open: active }" @click="toggle" />
                </template>
              </VInput>
            </template>

            <div class="dreamui-select-popover">
              <button
                v-for="item in sizeItems"
                :key="item.value"
                type="button"
                class="dreamui-select-option"
                :class="{ active: item.value === draft.size }"
                @click="
                  () => {
                    draft.size = item.value;
                    sizeMenuActive = false;
                    emitDraft();
                  }
                "
              >
                <div class="dreamui-select-option__content">
                  <span>{{ item.text }}</span>
                  <span class="dreamui-select-option__note">{{ item.note }}</span>
                </div>
              </button>
            </div>
          </VMenu>
        </label>

        <label class="dreamui-button-field__control">
          <span class="dreamui-button-field__label">Color</span>
          <div class="dreamui-button-field__color-row">
            <input
              class="dreamui-button-field__color-picker"
              type="color"
              :value="colorPickerValue"
              @input="onColorPickerInput"
            />

            <VInput
              v-model="draft.color"
              placeholder="#FFC857"
              @update:model-value="emitDraft"
            />
          </div>
        </label>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, onMounted } from 'vue';
import { useApi } from '@directus/extensions-sdk';

type UrlType = 'url_page' | 'custom_url' | 'url_other' | 'form';
type ButtonStyle = 'primary' | 'outline' | 'icon';
type ButtonSize = 'small' | 'medium' | 'large';
type ButtonTarget = '_self' | '_blank';
type OtherUrl = 'home' | 'blog' | 'portfolio';
type SettingsTab = 'content' | 'link' | 'styles';

type ButtonValue = {
  title: string;
  target: ButtonTarget;
  urlType: UrlType;
  page: string;
  form: string;
  customUrl: string;
  otherUrl: OtherUrl;
  style: ButtonStyle;
  size: ButtonSize;
  color: string;
  hasArrowIcon: boolean;
};

type PageOption = {
  text: string;
  value: string;
  note: string;
};

const DEFAULT_VALUE: ButtonValue = {
  title: '',
  target: '_self',
  urlType: 'url_page',
  page: '',
  form: '',
  customUrl: '',
  otherUrl: 'home',
  style: 'primary',
  size: 'medium',
  color: '',
  hasArrowIcon: false,
};

const tabs = [
  { label: 'Content', value: 'content' },
  { label: 'Link', value: 'link' },
  { label: 'Styles', value: 'styles' },
] as const;

const targetItems = [
  { text: 'Same tab', value: '_self', note: 'Open inside the current tab' },
  { text: 'New tab', value: '_blank', note: 'Open in a new browser tab' },
] as const;

const otherUrlItems = [
  { text: 'Home', value: 'home', note: '/' },
  { text: 'Blog', value: 'blog', note: '/blog' },
  { text: 'Portfolio', value: 'portfolio', note: '/portfolio' },
] as const;

const styleItems = [
  { text: 'Primary', value: 'primary', note: 'Main call-to-action button' },
  { text: 'Outline', value: 'outline', note: 'Secondary outlined button' },
  { text: 'Icon', value: 'icon', note: 'Compact icon-driven button' },
] as const;

const sizeItems = [
  { text: 'Small', value: 'small', note: 'Compact button size' },
  { text: 'Medium', value: 'medium', note: 'Default balanced size' },
  { text: 'Large', value: 'large', note: 'More prominent button size' },
] as const;

function normalizeValue(value: string | null): ButtonValue {
  if (!value) return { ...DEFAULT_VALUE };

  try {
    const parsed = JSON.parse(value) as Partial<ButtonValue>;

    return {
      title: typeof parsed.title === 'string' ? parsed.title : DEFAULT_VALUE.title,
      target: parsed.target === '_blank' ? '_blank' : DEFAULT_VALUE.target,
      urlType:
        parsed.urlType === 'custom_url' ||
        parsed.urlType === 'url_other' ||
        parsed.urlType === 'url_page' ||
        parsed.urlType === 'form'
          ? parsed.urlType
          : DEFAULT_VALUE.urlType,
      page: typeof parsed.page === 'string' ? parsed.page : DEFAULT_VALUE.page,
      form: typeof parsed.form === 'string' ? parsed.form : DEFAULT_VALUE.form,
      customUrl: typeof parsed.customUrl === 'string' ? parsed.customUrl : DEFAULT_VALUE.customUrl,
      otherUrl:
        parsed.otherUrl === 'blog' || parsed.otherUrl === 'portfolio' || parsed.otherUrl === 'home'
          ? parsed.otherUrl
          : DEFAULT_VALUE.otherUrl,
      style:
        parsed.style === 'outline' || parsed.style === 'icon' || parsed.style === 'primary'
          ? parsed.style
          : DEFAULT_VALUE.style,
      size:
        parsed.size === 'small' || parsed.size === 'large' || parsed.size === 'medium'
          ? parsed.size
          : DEFAULT_VALUE.size,
      color: typeof parsed.color === 'string' ? parsed.color : DEFAULT_VALUE.color,
      hasArrowIcon:
        typeof parsed.hasArrowIcon === 'boolean'
          ? parsed.hasArrowIcon
          : parsed.icon === 'arrow_right_alt' || parsed.icon === 'arrow_forward'
            ? true
            : DEFAULT_VALUE.hasArrowIcon,
    };
  } catch {
    return { ...DEFAULT_VALUE };
  }
}

function isHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{6})$/.test(value.trim());
}

export default defineComponent({
  props: {
    value: {
      type: String,
      default: null,
    },
  },
  emits: ['input'],
  setup(props, { emit }) {
    const api = useApi();
    const activeTab = ref<SettingsTab>('content');
    const draft = ref<ButtonValue>(normalizeValue(props.value));

    const styleMenuActive = ref(false);
    const sizeMenuActive = ref(false);
    const targetMenuActive = ref(false);
    const urlTypeMenuActive = ref(false);
    const otherUrlMenuActive = ref(false);
    const pageMenuActive = ref(false);
    const formMenuActive = ref(false);

    const pagesCollectionExists = ref(false);
    const pagesLoading = ref(false);
    const pageOptions = ref<PageOption[]>([]);
    const pageSearchQuery = ref('');
    const formsCollectionExists = ref(false);
    const formsLoading = ref(false);
    const formOptions = ref<PageOption[]>([]);
    const formSearchQuery = ref('');

    const urlTypeItems = ref([
      { text: 'URL page', value: 'url_page', note: 'Internal page or route slug' },
      { text: 'Custom URL', value: 'custom_url', note: 'Any absolute or relative URL' },
      { text: 'URL other', value: 'url_other', note: 'Choose from fixed preset routes' },
    ]);

    function syncUrlTypeItems() {
      const items = [
        { text: 'URL page', value: 'url_page', note: 'Internal page or route slug' },
        { text: 'Custom URL', value: 'custom_url', note: 'Any absolute or relative URL' },
        { text: 'URL other', value: 'url_other', note: 'Choose from fixed preset routes' },
      ];

      if (formsCollectionExists.value) {
        items.splice(1, 0, {
          text: 'Form',
          value: 'form',
          note: 'Link this button to a form from the forms collection',
        });
      }

      urlTypeItems.value = items;
    }

    const selectedStyleLabel = computed(() => {
      return styleItems.find((item) => item.value === draft.value.style)?.text ?? 'Primary';
    });

    const selectedSizeLabel = computed(() => {
      return sizeItems.find((item) => item.value === draft.value.size)?.text ?? 'Medium';
    });

    const selectedTargetLabel = computed(() => {
      return targetItems.find((item) => item.value === draft.value.target)?.text ?? 'Same tab';
    });

    const selectedUrlTypeLabel = computed(() => {
      const items = Array.isArray(urlTypeItems.value) ? urlTypeItems.value : [];
      return items.find((item) => item.value === draft.value.urlType)?.text ?? 'URL page';
    });

    const selectedOtherUrlLabel = computed(() => {
      return otherUrlItems.find((item) => item.value === draft.value.otherUrl)?.text ?? 'Home';
    });

    const selectedPageLabel = computed(() => {
      return pageOptions.value.find((item) => item.value === draft.value.page)?.text ?? draft.value.page;
    });

    const filteredPageOptions = computed(() => {
      if (!pageSearchQuery.value) return pageOptions.value;

      const query = pageSearchQuery.value.toLowerCase();

      return pageOptions.value.filter((item) => {
        return item.text.toLowerCase().includes(query) || item.note.toLowerCase().includes(query);
      });
    });

    const selectedFormLabel = computed(() => {
      return formOptions.value.find((item) => item.value === draft.value.form)?.text ?? draft.value.form;
    });

    const filteredFormOptions = computed(() => {
      if (!formSearchQuery.value) return formOptions.value;

      const query = formSearchQuery.value.toLowerCase();

      return formOptions.value.filter((item) => {
        return item.text.toLowerCase().includes(query) || item.note.toLowerCase().includes(query);
      });
    });

    const colorPickerValue = computed(() => {
      return isHexColor(draft.value.color) ? draft.value.color : '#ffc857';
    });

    watch(
      () => props.value,
      (value) => {
        draft.value = normalizeValue(value);
      },
    );

    async function loadPages() {
      pagesLoading.value = true;

      try {
        const fieldsResponse = await api.get('/fields/pages');
        const fields = Array.isArray(fieldsResponse.data?.data) ? fieldsResponse.data.data : [];
        const fieldNames = new Set<string>(fields.map((field: { field?: string }) => field.field || '').filter(Boolean));

        pagesCollectionExists.value = true;

        const labelField =
          ['title', 'name', 'slug', 'permalink', 'path'].find((field) => fieldNames.has(field)) ?? 'id';
        const valueField =
          ['slug', 'permalink', 'path', 'id'].find((field) => fieldNames.has(field)) ?? labelField;

        const queryFields = Array.from(new Set([labelField, valueField, 'id']));
        const itemsResponse = await api.get('/items/pages', {
          params: {
            fields: queryFields.join(','),
            limit: -1,
          },
        });

        const items = Array.isArray(itemsResponse.data?.data) ? itemsResponse.data.data : [];

        pageOptions.value = items
          .map((item: Record<string, unknown>) => {
            const value = String(item[valueField] ?? item.id ?? '').trim();
            const text = String(item[labelField] ?? value).trim();

            if (!value || !text) return null;

            return {
              text,
              value,
              note: labelField === valueField ? '' : value,
            };
          })
          .filter((item: PageOption | null): item is PageOption => item !== null)
          .sort((a, b) => a.text.localeCompare(b.text));
      } catch (error) {
        pagesCollectionExists.value = false;
        pageOptions.value = [];
      } finally {
        pagesLoading.value = false;
      }
    }

    async function loadForms() {
      formsLoading.value = true;

      try {
        const fieldsResponse = await api.get('/fields/forms');
        const fields = Array.isArray(fieldsResponse.data?.data) ? fieldsResponse.data.data : [];
        const fieldNames = new Set<string>(fields.map((field: { field?: string }) => field.field || '').filter(Boolean));

        formsCollectionExists.value = true;
        syncUrlTypeItems();

        const labelField =
          ['title', 'name', 'label', 'slug', 'id'].find((field) => fieldNames.has(field)) ?? 'id';
        const valueField =
          ['slug', 'key', 'id'].find((field) => fieldNames.has(field)) ?? labelField;

        const queryFields = Array.from(new Set([labelField, valueField, 'id']));
        const itemsResponse = await api.get('/items/forms', {
          params: {
            fields: queryFields.join(','),
            limit: -1,
          },
        });

        const items = Array.isArray(itemsResponse.data?.data) ? itemsResponse.data.data : [];

        formOptions.value = items
          .map((item: Record<string, unknown>) => {
            const value = String(item[valueField] ?? item.id ?? '').trim();
            const text = String(item[labelField] ?? value).trim();

            if (!value || !text) return null;

            return {
              text,
              value,
              note: labelField === valueField ? '' : value,
            };
          })
          .filter((item: PageOption | null): item is PageOption => item !== null)
          .sort((a, b) => a.text.localeCompare(b.text));
      } catch (error) {
        formsCollectionExists.value = false;
        formOptions.value = [];
        syncUrlTypeItems();

        if (draft.value.urlType === 'form') {
          draft.value.urlType = 'url_page';
        }

        console.error('DreamUI Button: failed to load forms collection', error);
      } finally {
        formsLoading.value = false;
      }
    }

    onMounted(() => {
      syncUrlTypeItems();
      loadPages();
      loadForms();
    });

    function emitDraft() {
      emit(
        'input',
        JSON.stringify({
          ...draft.value,
          icon: draft.value.hasArrowIcon ? 'arrow_right_alt' : null,
        }),
      );
    }

    function onPageSearchInput(value: string | number | null) {
      pageSearchQuery.value = typeof value === 'string' ? value : '';
    }

    function onFormSearchInput(value: string | number | null) {
      formSearchQuery.value = typeof value === 'string' ? value : '';
    }

    function onColorPickerInput(event: Event) {
      draft.value.color = (event.target as HTMLInputElement).value;
      emitDraft();
    }

    function onArrowIconToggle(value: boolean | string | number | null) {
      draft.value.hasArrowIcon = value === true;
      emitDraft();
    }

    return {
      activeTab,
      colorPickerValue,
      draft,
      emitDraft,
      filteredFormOptions,
      filteredPageOptions,
      formMenuActive,
      formOptions,
      formSearchQuery,
      formsCollectionExists,
      formsLoading,
      onColorPickerInput,
      onArrowIconToggle,
      onFormSearchInput,
      onPageSearchInput,
      otherUrlItems,
      otherUrlMenuActive,
      pageMenuActive,
      pageOptions,
      pageSearchQuery,
      pagesCollectionExists,
      pagesLoading,
      selectedFormLabel,
      selectedOtherUrlLabel,
      selectedPageLabel,
      selectedSizeLabel,
      selectedStyleLabel,
      sizeItems,
      sizeMenuActive,
      selectedTargetLabel,
      selectedUrlTypeLabel,
      styleItems,
      styleMenuActive,
      tabs,
      targetItems,
      targetMenuActive,
      urlTypeItems,
      urlTypeMenuActive,
    };
  },
});
</script>

<style scoped>
.dreamui-button-field {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.dreamui-button-field__tabs {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
}

.dreamui-button-field__tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.25rem;
  padding: 0 0.875rem;
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: 999px;
  background: var(--theme--background-normal);
  color: var(--theme--foreground-subdued);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.dreamui-button-field__tab.active {
  border-color: var(--theme--primary);
  background: var(--theme--primary-background);
  color: var(--theme--primary);
}

.dreamui-button-field__section {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 1rem;
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
  background: var(--theme--background-page);
}

.dreamui-button-field__section-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dreamui-button-field__section-header--tight {
  margin-bottom: -0.25rem;
}

.dreamui-button-field__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--theme--foreground);
}

.dreamui-button-field__hint {
  font-size: 0.8125rem;
  color: var(--theme--foreground-subdued);
}

.dreamui-button-field__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 1rem;
}

.dreamui-button-field__control {
  display: flex;
  flex-direction: column;
  gap: 0.4375rem;
}

.dreamui-button-field__control--checkbox {
  justify-content: flex-end;
}

.dreamui-button-field__control--full {
  grid-column: 1 / -1;
}

.dreamui-button-field__label {
  color: var(--theme--foreground-subdued);
  font-size: 0.875rem;
  font-weight: 600;
}

.dreamui-button-field__empty {
  padding: 0.75rem;
  color: var(--theme--foreground-subdued);
}

.dreamui-button-field__color-row {
  display: grid;
  grid-template-columns: 3.25rem minmax(0, 1fr);
  gap: 0.75rem;
  align-items: center;
}

.dreamui-button-field__color-picker {
  width: 100%;
  height: 2.75rem;
  padding: 0.25rem;
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
  background: var(--theme--background-normal);
  cursor: pointer;
}

.dreamui-select-popover {
  min-width: 15rem;
  max-height: 20rem;
  padding: 0.375rem;
  overflow: auto;
}

.dreamui-select-popover--pages {
  min-width: min(30rem, 100vw - 4rem);
}

.dreamui-select-option {
  display: flex;
  width: 100%;
  align-items: flex-start;
  padding: 0.625rem 0.75rem;
  border: 0;
  border-radius: var(--theme--border-radius);
  background: transparent;
  color: var(--theme--foreground);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.dreamui-select-option:hover,
.dreamui-select-option.active {
  background: var(--theme--background-highlight);
}

.dreamui-select-option__content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.dreamui-select-option__note {
  font-size: 0.8125rem;
  color: var(--theme--foreground-subdued);
}

.open-indicator {
  transform: scaleY(1);
  transition: transform var(--fast) var(--transition);
}

.open-indicator.open {
  transform: scaleY(-1);
}
</style>
