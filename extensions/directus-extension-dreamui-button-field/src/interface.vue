<template>
  <div class="dreamui-button-field">
    <div class="dreamui-button-field__section">
      <div class="dreamui-button-field__section-header">
        <span class="dreamui-button-field__title">Content</span>
        <span class="dreamui-button-field__hint">Main button label and optional icon</span>
      </div>

      <div class="dreamui-button-field__grid">
        <label class="dreamui-button-field__control">
          <span class="dreamui-button-field__label">Title</span>
          <VInput v-model="draft.title" placeholder="Learn more" @update:model-value="emitDraft" />
        </label>

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
      </div>

      <div class="dreamui-button-field__icon">
        <div class="dreamui-button-field__section-header dreamui-button-field__section-header--tight">
          <span class="dreamui-button-field__label">Icon</span>
          <span class="dreamui-button-field__hint">Uses the DreamUI icon picker when it is installed</span>
        </div>

        <component
          :is="iconInterfaceComponent"
          v-if="iconInterfaceComponent"
          :value="draft.icon"
          @input="onIconInput"
        />

        <div v-else class="dreamui-button-field__fallback">
          <VNotice type="warning">
            <template #default>
              <div class="dreamui-button-field__notice">
                <strong>`dreamui-icon-field` is not installed.</strong>
                <span>Install it to get the icon picker. For now you can paste the stored icon JSON manually.</span>
              </div>
            </template>
          </VNotice>

          <VInput
            :model-value="draft.icon"
            placeholder='{"library":"lucide","name":"ArrowRight","strokeWidth":2}'
            @update:model-value="onIconInput"
          />
        </div>
      </div>
    </div>

    <div class="dreamui-button-field__section">
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

        <label v-if="draft.urlType === 'url_page'" class="dreamui-button-field__control dreamui-button-field__control--full">
          <span class="dreamui-button-field__label">Page</span>
          <VInput v-model="draft.page" placeholder="/about" @update:model-value="emitDraft" />
        </label>

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

    <div class="dreamui-button-field__summary">
      <span class="dreamui-button-field__title">Summary</span>
      <div class="dreamui-button-field__summary-card">
        <div class="dreamui-button-field__summary-line">
          <span class="dreamui-button-field__summary-key">Label</span>
          <span>{{ draft.title || 'Untitled button' }}</span>
        </div>
        <div class="dreamui-button-field__summary-line">
          <span class="dreamui-button-field__summary-key">Resolved URL</span>
          <span>{{ resolvedUrl || 'Not configured' }}</span>
        </div>
        <div class="dreamui-button-field__summary-line">
          <span class="dreamui-button-field__summary-key">Style</span>
          <span>{{ selectedStyleLabel }}</span>
        </div>
        <div class="dreamui-button-field__summary-line">
          <span class="dreamui-button-field__summary-key">Target</span>
          <span>{{ selectedTargetLabel }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from 'vue';
import { useExtensions } from '@directus/extensions-sdk';

type UrlType = 'url_page' | 'custom_url' | 'url_other';
type ButtonStyle = 'primary' | 'outline' | 'icon';
type ButtonTarget = '_self' | '_blank';
type OtherUrl = 'home' | 'blog' | 'portfolio';

type ButtonValue = {
  title: string;
  target: ButtonTarget;
  urlType: UrlType;
  page: string;
  customUrl: string;
  otherUrl: OtherUrl;
  style: ButtonStyle;
  icon: string | null;
};

const DEFAULT_VALUE: ButtonValue = {
  title: '',
  target: '_self',
  urlType: 'url_page',
  page: '',
  customUrl: '',
  otherUrl: 'home',
  style: 'primary',
  icon: null,
};

const targetItems = [
  { text: 'Same tab', value: '_self', note: 'Open inside the current tab' },
  { text: 'New tab', value: '_blank', note: 'Open in a new browser tab' },
] as const;

const urlTypeItems = [
  { text: 'URL page', value: 'url_page', note: 'Internal page or route slug' },
  { text: 'Custom URL', value: 'custom_url', note: 'Any absolute or relative URL' },
  { text: 'URL other', value: 'url_other', note: 'Choose from fixed preset routes' },
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

function normalizeValue(value: string | null): ButtonValue {
  if (!value) return { ...DEFAULT_VALUE };

  try {
    const parsed = JSON.parse(value) as Partial<ButtonValue>;

    return {
      title: typeof parsed.title === 'string' ? parsed.title : DEFAULT_VALUE.title,
      target: parsed.target === '_blank' ? '_blank' : DEFAULT_VALUE.target,
      urlType:
        parsed.urlType === 'custom_url' || parsed.urlType === 'url_other' || parsed.urlType === 'url_page'
          ? parsed.urlType
          : DEFAULT_VALUE.urlType,
      page: typeof parsed.page === 'string' ? parsed.page : DEFAULT_VALUE.page,
      customUrl: typeof parsed.customUrl === 'string' ? parsed.customUrl : DEFAULT_VALUE.customUrl,
      otherUrl:
        parsed.otherUrl === 'blog' || parsed.otherUrl === 'portfolio' || parsed.otherUrl === 'home'
          ? parsed.otherUrl
          : DEFAULT_VALUE.otherUrl,
      style:
        parsed.style === 'outline' || parsed.style === 'icon' || parsed.style === 'primary'
          ? parsed.style
          : DEFAULT_VALUE.style,
      icon: typeof parsed.icon === 'string' ? parsed.icon : null,
    };
  } catch {
    return { ...DEFAULT_VALUE };
  }
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
    const extensions = useExtensions();
    const draft = ref<ButtonValue>(normalizeValue(props.value));

    const styleMenuActive = ref(false);
    const targetMenuActive = ref(false);
    const urlTypeMenuActive = ref(false);
    const otherUrlMenuActive = ref(false);

    const iconInterfaceComponent = computed(() => {
      return extensions.value.interfaces?.['dreamui-icon-field']?.component ?? null;
    });

    const selectedStyleLabel = computed(() => {
      return styleItems.find((item) => item.value === draft.value.style)?.text ?? 'Primary';
    });

    const selectedTargetLabel = computed(() => {
      return targetItems.find((item) => item.value === draft.value.target)?.text ?? 'Same tab';
    });

    const selectedUrlTypeLabel = computed(() => {
      return urlTypeItems.find((item) => item.value === draft.value.urlType)?.text ?? 'URL page';
    });

    const selectedOtherUrlLabel = computed(() => {
      return otherUrlItems.find((item) => item.value === draft.value.otherUrl)?.text ?? 'Home';
    });

    const resolvedUrl = computed(() => {
      if (draft.value.urlType === 'url_page') return draft.value.page.trim();
      if (draft.value.urlType === 'custom_url') return draft.value.customUrl.trim();

      const presetMap: Record<OtherUrl, string> = {
        home: '/',
        blog: '/blog',
        portfolio: '/portfolio',
      };

      return presetMap[draft.value.otherUrl];
    });

    watch(
      () => props.value,
      (value) => {
        draft.value = normalizeValue(value);
      },
    );

    function emitDraft() {
      emit('input', JSON.stringify(draft.value));
    }

    function onIconInput(value: string | null) {
      draft.value.icon = value || null;
      emitDraft();
    }

    return {
      draft,
      emitDraft,
      iconInterfaceComponent,
      onIconInput,
      otherUrlItems,
      otherUrlMenuActive,
      resolvedUrl,
      selectedOtherUrlLabel,
      selectedStyleLabel,
      selectedTargetLabel,
      selectedUrlTypeLabel,
      styleItems,
      styleMenuActive,
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
  gap: 1rem;
}

.dreamui-button-field__section,
.dreamui-button-field__summary {
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

.dreamui-button-field__control--full {
  grid-column: 1 / -1;
}

.dreamui-button-field__label {
  color: var(--theme--foreground-subdued);
  font-size: 0.875rem;
  font-weight: 600;
}

.dreamui-button-field__icon,
.dreamui-button-field__fallback {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dreamui-button-field__notice {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dreamui-button-field__summary-card {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.dreamui-button-field__summary-line {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.625rem;
  border-bottom: var(--theme--border-width) solid var(--theme--border-color-subdued);
}

.dreamui-button-field__summary-line:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.dreamui-button-field__summary-key {
  color: var(--theme--foreground-subdued);
}

.dreamui-select-popover {
  min-width: 15rem;
  padding: 0.375rem;
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
