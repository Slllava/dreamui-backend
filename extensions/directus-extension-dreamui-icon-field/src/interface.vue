<template>
  <div class="dreamui-icon-field">
    <div class="dreamui-icon-field__toolbar">
      <label class="dreamui-icon-field__control">
        <span class="dreamui-icon-field__label">Library</span>
        <VSelect v-model="libraryModel" :items="libraryItems" item-text="text" item-value="value" />
      </label>

      <label v-if="selectedLibrary === 'lucide'" class="dreamui-icon-field__control">
        <span class="dreamui-icon-field__label">Stroke width</span>

        <div class="dreamui-icon-field__stroke-controls">
          <VSlider
            v-model="strokeWidthDraft"
            :min="0.5"
            :max="4"
            :step="0.25"
            @update:model-value="onStrokeWidthChange"
          />

          <VInput
            v-model="strokeWidthInput"
            type="number"
            min="0.5"
            max="4"
            step="0.25"
            @update:model-value="onStrokeWidthInputChange"
          />
        </div>
      </label>

      <label v-if="selectedLibrary === 'remix'" class="dreamui-icon-field__control">
        <span class="dreamui-icon-field__label">Variant</span>
        <VSelect v-model="remixVariantModel" :items="remixVariantItems" item-text="text" item-value="value" />
      </label>
    </div>

    <div class="dreamui-icon-field__control">
      <span class="dreamui-icon-field__label">Icons</span>

      <VMenu v-model="menuActive" attached no-focus-return>
        <template #activator="{ active, activate, deactivate, toggle }">
          <VInput
            v-model="searchQuery"
            :placeholder="selectedIcon ? selectedIcon.label : 'Search for icon...'"
            :class="{ 'has-value': selectedIcon }"
            :nullable="false"
            @click="onClickInput($event, toggle)"
            @keydown="onKeydownInput($event, activate)"
          >
            <template v-if="selectedIcon" #prepend>
              <component
                :is="IconRenderer"
                class="selected-icon"
                :icon="selectedIcon"
                :size="20"
                :stroke-width="currentStrokeWidth"
              />
            </template>

            <template #append>
              <div class="item-actions">
                <VRemove
                  v-if="selectedIcon"
                  deselect
                  @action="
                    () => {
                      clearValue();
                      deactivate();
                    }
                  "
                />

                <VIcon
                  v-else
                  clickable
                  name="expand_more"
                  class="open-indicator"
                  :class="{ open: active }"
                  @click="toggle"
                />
              </div>
            </template>
          </VInput>
        </template>

        <div ref="contentRef" class="select-icon-popover">
          <template v-for="group in groupedIcons" :key="group.name">
            <VDivider v-if="group.icons.length > 0" inline-title class="icon-row icon-row--header">
              {{ group.name }}
            </VDivider>

            <div
              v-if="group.icons.length > 0"
              class="icon-row"
              :style="{
                '--icons-per-row': iconsPerRow,
                '--icon-size': `${iconSize}px`,
                '--gap': `${gap}px`,
              }"
            >
              <button
                v-for="icon in group.icons"
                :key="icon.id"
                type="button"
                class="dreamui-icon-button"
                :class="{ active: icon.id === selectedIconId }"
                :title="icon.label"
                @click="selectIcon(icon)"
              >
                <component :is="IconRenderer" :icon="icon" :size="20" :stroke-width="currentStrokeWidth" />
              </button>
            </div>
          </template>

          <div v-if="groupedIcons.length === 0 || groupedIcons.every((group) => group.icons.length === 0)" class="dreamui-empty">
            No icons found
          </div>
        </div>
      </VMenu>
    </div>
  </div>
</template>

<script lang="ts">
import type { Component, PropType, Ref } from 'vue';
import { computed, defineComponent, h, nextTick, onUnmounted, ref, watch } from 'vue';
import * as lucideIcons from 'lucide';
import * as remixIcons from '@remixicon/vue';

type IconLibrary = 'lucide' | 'remix';
type RemixVariant = 'all' | 'line' | 'fill';

type StoredValue = {
  library: IconLibrary;
  name: string;
  strokeWidth?: number;
};

type LucideNode = [string, Record<string, string>][];

type IconOption = {
  id: string;
  label: string;
  library: IconLibrary;
  name: string;
  group: string;
  component?: Component;
  iconNode?: LucideNode;
};

const DEFAULT_STROKE_WIDTH = 2;
const MIN_ITEM_SIZE = 32;
const libraryItems = [
  { text: 'Lucide', value: 'lucide' },
  { text: 'Remix Icon', value: 'remix' },
] as const;
const remixVariantItems = [
  { text: 'All', value: 'all' },
  { text: 'Line', value: 'line' },
  { text: 'Fill', value: 'fill' },
] as const;

const LucideRenderer = defineComponent({
  name: 'LucideRenderer',
  props: {
    iconNode: {
      type: Array as PropType<LucideNode>,
      required: true,
    },
    size: {
      type: Number,
      default: 24,
    },
    strokeWidth: {
      type: Number,
      default: DEFAULT_STROKE_WIDTH,
    },
  },
  setup(props) {
    return () =>
      h(
        'svg',
        {
          xmlns: 'http://www.w3.org/2000/svg',
          width: props.size,
          height: props.size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': props.strokeWidth,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        },
        props.iconNode.map(([tag, attrs], index) => h(tag, { key: `${tag}-${index}`, ...attrs })),
      );
  },
});

const IconRenderer = defineComponent({
  name: 'IconRenderer',
  props: {
    icon: {
      type: Object as PropType<IconOption>,
      required: true,
    },
    size: {
      type: Number,
      default: 24,
    },
    strokeWidth: {
      type: Number,
      default: DEFAULT_STROKE_WIDTH,
    },
  },
  setup(props) {
    return () => {
      if (props.icon.library === 'lucide' && props.icon.iconNode) {
        return h(LucideRenderer, {
          iconNode: props.icon.iconNode,
          size: props.size,
          strokeWidth: props.strokeWidth,
        });
      }

      if (props.icon.component) {
        return h(props.icon.component, {
          size: String(props.size),
        });
      }

      return null;
    };
  },
});

function toLucideLabel(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').trim();
}

function toRemixLabel(name: string): string {
  return name.replace(/^Ri/, '').replace(/Icon$/, '').replace(/([a-z0-9])([A-Z])/g, '$1 $2').trim();
}

const lucideList = Object.entries(lucideIcons)
  .filter(([name, iconNode]) => {
    return (
      /^[A-Z]/.test(name) &&
      Array.isArray(iconNode) &&
      iconNode.every((entry) => Array.isArray(entry) && typeof entry[0] === 'string')
    );
  })
  .map(([name, iconNode]) => ({
    id: `lucide:${name}`,
    label: toLucideLabel(name),
    library: 'lucide' as const,
    name,
    group: 'Lucide',
    iconNode: iconNode as LucideNode,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

const remixList = Object.entries(remixIcons)
  .filter(([name, component]) => /^Ri[A-Z0-9]/.test(name) && typeof component === 'object')
  .map(([name, component]) => ({
    id: `remix:${name}`,
    label: toRemixLabel(name),
    library: 'remix' as const,
    name,
    group: name.endsWith('Line') ? 'Line' : name.endsWith('Fill') ? 'Fill' : 'Remix',
    component: component as Component,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

const iconMap = new Map<string, IconOption>([...lucideList, ...remixList].map((icon) => [icon.id, icon]));
const lucideNames = new Set(lucideList.map((icon) => icon.name));
const remixNames = new Set(remixList.map((icon) => icon.name));

function safeParseValue(value: string | null): StoredValue | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<StoredValue>;

    if (!parsed || typeof parsed !== 'object' || typeof parsed.name !== 'string') return null;

    return {
      library: parsed.library === 'remix' ? 'remix' : 'lucide',
      name: parsed.name,
      strokeWidth:
        parsed.library !== 'remix' && typeof parsed.strokeWidth === 'number'
          ? parsed.strokeWidth
          : DEFAULT_STROKE_WIDTH,
    };
  } catch {
    if (lucideNames.has(value)) return { library: 'lucide', name: value, strokeWidth: DEFAULT_STROKE_WIDTH };
    if (remixNames.has(value)) return { library: 'remix', name: value };
    return null;
  }
}

function useIconsPerRow(contentRef: Ref<HTMLElement | undefined>, menuActive: Ref<boolean>) {
  const iconSize = 24;
  const gap = 8;
  const iconsPerRow = ref(1);
  let resizeObserver: ResizeObserver | null = null;

  function calculateIconsPerRow() {
    if (!contentRef.value) return;

    const contentWidth = contentRef.value.clientWidth;
    const availableWidth = contentWidth - 24;
    const nextIconsPerRow = Math.floor(availableWidth / (iconSize + gap));
    iconsPerRow.value = Math.max(1, nextIconsPerRow);
  }

  function setupResizeObserver() {
    if (!contentRef.value) return;

    resizeObserver?.disconnect();
    resizeObserver = new ResizeObserver(() => calculateIconsPerRow());
    resizeObserver.observe(contentRef.value);
  }

  watch(menuActive, async (isActive) => {
    if (isActive) {
      await nextTick();
      setupResizeObserver();
      calculateIconsPerRow();
    } else {
      resizeObserver?.disconnect();
      resizeObserver = null;
    }
  });

  onUnmounted(() => resizeObserver?.disconnect());

  return { iconsPerRow, iconSize, gap };
}

export default defineComponent({
  components: {
    IconRenderer,
  },
  props: {
    value: {
      type: String,
      default: null,
    },
  },
  emits: ['input'],
  setup(props, { emit }) {
    const searchQuery = ref('');
    const menuActive = ref(false);
    const remixVariant = ref<RemixVariant>('all');
    const strokeWidthDraft = ref(DEFAULT_STROKE_WIDTH);
    const strokeWidthInput = ref(String(DEFAULT_STROKE_WIDTH));
    const contentRef = ref<HTMLElement>();

    const { iconsPerRow, iconSize, gap } = useIconsPerRow(contentRef, menuActive);

    const parsedValue = computed(() => safeParseValue(props.value));
    const selectedLibrary = computed<IconLibrary>(() => parsedValue.value?.library ?? 'lucide');
    const currentStrokeWidth = computed(() => parsedValue.value?.strokeWidth ?? DEFAULT_STROKE_WIDTH);
    const selectedIconId = computed(() => {
      const parsed = parsedValue.value;
      return parsed ? `${parsed.library}:${parsed.name}` : '';
    });
    const selectedIcon = computed(() => (selectedIconId.value ? iconMap.get(selectedIconId.value) ?? null : null));
    const libraryModel = computed<IconLibrary>({
      get: () => selectedLibrary.value,
      set: (value) => setLibrary(value),
    });
    const remixVariantModel = computed<RemixVariant>({
      get: () => remixVariant.value,
      set: (value) => setRemixVariant(value),
    });

    const availableIcons = computed(() => {
      if (selectedLibrary.value === 'lucide') return lucideList;

      if (remixVariant.value === 'line') return remixList.filter((icon) => icon.group === 'Line');
      if (remixVariant.value === 'fill') return remixList.filter((icon) => icon.group === 'Fill');
      return remixList;
    });

    const filteredIcons = computed(() => {
      if (!searchQuery.value) return availableIcons.value;
      const query = searchQuery.value.toLowerCase();

      return availableIcons.value.filter((icon) => {
        return icon.label.toLowerCase().includes(query) || icon.name.toLowerCase().includes(query);
      });
    });

    const groupedIcons = computed(() => {
      if (selectedLibrary.value === 'lucide') {
        return [{ name: 'Lucide', icons: filteredIcons.value }];
      }

      if (remixVariant.value === 'all') {
        return [
          { name: 'Line', icons: filteredIcons.value.filter((icon) => icon.group === 'Line') },
          { name: 'Fill', icons: filteredIcons.value.filter((icon) => icon.group === 'Fill') },
        ].filter((group) => group.icons.length > 0);
      }

      return [
        {
          name: remixVariant.value === 'line' ? 'Line' : 'Fill',
          icons: filteredIcons.value,
        },
      ];
    });

    watch(
      currentStrokeWidth,
      (value) => {
        strokeWidthDraft.value = value;
        strokeWidthInput.value = String(value);
      },
      { immediate: true },
    );

    function emitValue(next: StoredValue | null) {
      emit('input', next ? JSON.stringify(next) : null);
    }

    function setLibrary(value: string | number | null) {
      const nextLibrary = value === 'remix' ? 'remix' : 'lucide';
      const source = nextLibrary === 'lucide' ? lucideList : remixList;
      const first = source[0];
      searchQuery.value = '';
      remixVariant.value = 'all';

      emitValue({
        library: nextLibrary,
        name: first?.name ?? '',
        strokeWidth: nextLibrary === 'lucide' ? currentStrokeWidth.value : undefined,
      });
    }

    function setRemixVariant(value: string | number | null) {
      remixVariant.value = value === 'line' || value === 'fill' ? value : 'all';
      searchQuery.value = '';
    }

    function onStrokeWidthChange(value: number | string) {
      const nextValue = typeof value === 'string' ? Number.parseFloat(value) : value;
      if (!parsedValue.value || parsedValue.value.library !== 'lucide' || Number.isNaN(nextValue)) return;

      emitValue({
        ...parsedValue.value,
        strokeWidth: Math.max(0.5, Math.min(4, nextValue)),
      });
    }

    function onStrokeWidthInputChange(value: number | string) {
      onStrokeWidthChange(value);
    }

    function selectIcon(icon: IconOption) {
      searchQuery.value = '';
      emitValue({
        library: icon.library,
        name: icon.name,
        strokeWidth: icon.library === 'lucide' ? currentStrokeWidth.value : undefined,
      });
    }

    function clearValue() {
      searchQuery.value = '';
      emit('input', null);
    }

    function onClickInput(event: InputEvent, toggle: () => void) {
      if ((event.target as HTMLInputElement).tagName === 'INPUT') toggle();
    }

    function onKeydownInput(event: KeyboardEvent, activate: () => void) {
      const systemKeys = event.metaKey || event.altKey || event.ctrlKey || event.shiftKey || event.key === 'Tab';
      if (!event.repeat && !systemKeys && (event.target as HTMLInputElement).tagName === 'INPUT') activate();
    }

    return {
      IconRenderer,
      MIN_ITEM_SIZE,
      clearValue,
      contentRef,
      currentStrokeWidth,
      gap,
      groupedIcons,
      iconSize,
      iconsPerRow,
      libraryItems,
      libraryModel,
      menuActive,
      onClickInput,
      onKeydownInput,
      onStrokeWidthChange,
      onStrokeWidthInputChange,
      remixVariant,
      remixVariantItems,
      remixVariantModel,
      searchQuery,
      selectIcon,
      selectedIcon,
      selectedIconId,
      selectedLibrary,
      strokeWidthDraft,
      strokeWidthInput,
    };
  },
});
</script>

<style scoped>
.dreamui-icon-field {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dreamui-icon-field__toolbar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
  gap: 1rem;
}

.dreamui-icon-field__control {
  display: flex;
  flex-direction: column;
  gap: 0.4375rem;
}

.dreamui-icon-field__label {
  color: var(--theme--foreground-subdued);
  font-size: 0.875rem;
  font-weight: 600;
}

.dreamui-icon-field__stroke-controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 9.5rem;
  gap: 1rem;
  align-items: center;
}

.dreamui-icon-field__stroke-controls :deep(.v-slider) {
  inline-size: 100%;
  margin-block-start: 0.6875rem;
}

.item-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
}

.selected-icon {
  color: var(--theme--primary);
}

.dreamui-icon-field :deep(.v-input.has-value) {
  --v-input-placeholder-color: var(--theme--primary);
}

.dreamui-icon-field :deep(.v-input.has-value:focus-within) {
  --v-input-placeholder-color: var(--theme--form--field--input--foreground-subdued);
}

.select-icon-popover {
  --v-icon-color-hover: var(--theme--form--field--input--foreground);

  padding: 0.4375rem;
}

.icon-row {
  display: grid;
  gap: var(--gap, 0.5rem);
  grid-template-columns: repeat(var(--icons-per-row, 1), var(--icon-size, 1.5rem));
  justify-content: start;
  color: var(--theme--form--field--input--foreground-subdued);
  padding: 0.25rem;
}

.icon-row--header {
  display: block;
  padding-block-start: 0.5rem;
}

.dreamui-icon-button {
  inline-size: 1.5rem;
  block-size: 1.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 0;
  padding: 0;
  color: var(--theme--form--field--input--foreground-subdued);
  cursor: pointer;
}

.dreamui-icon-button:hover,
.dreamui-icon-button.active {
  color: var(--theme--primary);
}

.dreamui-empty {
  padding: 0.5rem;
  color: var(--theme--foreground-subdued);
}

.open-indicator {
  transform: scaleY(1);
  transition: transform var(--fast) var(--transition);
}

.open-indicator.open {
  transform: scaleY(-1);
}

@media (max-width: 50rem) {
  .dreamui-icon-field__stroke-controls {
    grid-template-columns: 1fr;
  }
}
</style>
