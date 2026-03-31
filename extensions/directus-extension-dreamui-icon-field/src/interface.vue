<template>
  <div ref="root" class="dreamui-icon-field">
    <div class="dreamui-icon-field__toolbar">
      <label class="dreamui-icon-field__control">
        <span class="dreamui-icon-field__label">Library</span>
        <select :value="selectedLibrary" class="dreamui-icon-field__native-select" @change="onLibraryChange">
          <option value="lucide">Lucide</option>
          <option value="remix">Remix Icon</option>
        </select>
      </label>

      <label v-if="selectedLibrary === 'lucide'" class="dreamui-icon-field__control dreamui-icon-field__control--stroke">
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
            class="dreamui-icon-field__stroke-input"
            type="number"
            min="0.5"
            max="4"
            step="0.25"
            @update:model-value="onStrokeWidthInputChange"
          />
        </div>
      </label>
    </div>

    <div class="dreamui-icon-field__control">
      <span class="dreamui-icon-field__label">Icons</span>

      <div class="dreamui-icon-field__dropdown">
        <button
          type="button"
          class="dreamui-icon-field__trigger"
          :class="{ 'dreamui-icon-field__trigger--open': isOpen }"
          @click="toggleOpen"
        >
          <span class="dreamui-icon-field__trigger-value">
            <span v-if="selectedIcon" class="dreamui-icon-field__trigger-icon">
              <component :is="IconRenderer" :icon="selectedIcon" :size="18" :stroke-width="currentStrokeWidth" />
            </span>
            <span>{{ selectedIcon ? selectedIcon.label : 'Search for icon...' }}</span>
          </span>

          <VIcon :name="isOpen ? 'expand_less' : 'expand_more'" small />
        </button>

        <div v-if="isOpen" class="dreamui-icon-field__menu">
          <div class="dreamui-icon-field__icons">
            <button
              v-for="icon in filteredIcons"
              :key="icon.id"
              type="button"
              class="dreamui-icon-field__icon-button"
              :class="{ 'dreamui-icon-field__icon-button--active': icon.id === selectedIconId }"
              :title="icon.label"
              @click="selectIcon(icon.id)"
            >
              <component :is="IconRenderer" :icon="icon" :size="18" :stroke-width="currentStrokeWidth" />
            </button>

            <div v-if="filteredIcons.length === 0" class="dreamui-icon-field__empty">
              No icons found
            </div>
          </div>

          <div class="dreamui-icon-field__search">
            <VInput
              v-model="query"
              placeholder="Search for icon..."
              @update:model-value="onQueryChange"
            />
          </div>
        </div>
      </div>
    </div>

    <code v-if="value" class="dreamui-icon-field__value">{{ value }}</code>
  </div>
</template>

<script lang="ts">
import type { Component, PropType } from 'vue';
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as lucideIcons from 'lucide';
import * as remixIcons from '@remixicon/vue';

type IconLibrary = 'lucide' | 'remix';

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
  component?: Component;
  iconNode?: LucideNode;
};

const DEFAULT_STROKE_WIDTH = 2;

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

    if (!parsed || typeof parsed !== 'object' || typeof parsed.name !== 'string') {
      return null;
    }

    const library = parsed.library === 'remix' ? 'remix' : 'lucide';
    const strokeWidth =
      library === 'lucide' && typeof parsed.strokeWidth === 'number'
        ? parsed.strokeWidth
        : DEFAULT_STROKE_WIDTH;

    return {
      library,
      name: parsed.name,
      strokeWidth,
    };
  } catch {
    if (lucideNames.has(value)) {
      return { library: 'lucide', name: value, strokeWidth: DEFAULT_STROKE_WIDTH };
    }

    if (remixNames.has(value)) {
      return { library: 'remix', name: value };
    }

    return null;
  }
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
    const root = ref<HTMLElement | null>(null);
    const isOpen = ref(false);
    const query = ref('');
    const strokeWidthDraft = ref(DEFAULT_STROKE_WIDTH);
    const strokeWidthInput = ref(String(DEFAULT_STROKE_WIDTH));

    const parsedValue = computed(() => safeParseValue(props.value));
    const selectedLibrary = computed<IconLibrary>(() => parsedValue.value?.library ?? 'lucide');
    const currentStrokeWidth = computed(() => parsedValue.value?.strokeWidth ?? DEFAULT_STROKE_WIDTH);
    const selectedIconId = computed(() => {
      const parsed = parsedValue.value;
      return parsed ? `${parsed.library}:${parsed.name}` : '';
    });
    const selectedIcon = computed(() => iconMap.get(selectedIconId.value) ?? null);

    const filteredIcons = computed(() => {
      const normalizedQuery = query.value.trim().toLowerCase();
      const source = selectedLibrary.value === 'lucide' ? lucideList : remixList;

      if (!normalizedQuery) return source;

      return source.filter((icon) => {
        return (
          icon.label.toLowerCase().includes(normalizedQuery) ||
          icon.name.toLowerCase().includes(normalizedQuery)
        );
      });
    });

    watch(
      currentStrokeWidth,
      (value) => {
        strokeWidthDraft.value = value;
        strokeWidthInput.value = String(value);
      },
      { immediate: true },
    );

    function emitValue(next: StoredValue | null): void {
      emit('input', next ? JSON.stringify(next) : null);
    }

    function onLibraryChange(event: Event): void {
      const target = event.target as HTMLSelectElement;
      const nextLibrary = target.value === 'remix' ? 'remix' : 'lucide';
      const source = nextLibrary === 'lucide' ? lucideList : remixList;
      const firstIcon = source[0];

      query.value = '';

      emitValue({
        library: nextLibrary,
        name: firstIcon?.name ?? '',
        strokeWidth: nextLibrary === 'lucide' ? currentStrokeWidth.value : undefined,
      });
    }

    function updateStrokeWidth(nextValue: number): void {
      const parsed = parsedValue.value;

      if (!parsed || parsed.library !== 'lucide' || Number.isNaN(nextValue)) return;

      const clampedValue = Math.min(4, Math.max(0.5, nextValue));

      emitValue({
        ...parsed,
        strokeWidth: clampedValue,
      });
    }

    function onStrokeWidthChange(value: number | string): void {
      const nextValue = typeof value === 'string' ? Number.parseFloat(value) : value;
      updateStrokeWidth(nextValue);
    }

    function onStrokeWidthInputChange(value: string | number): void {
      const nextValue = typeof value === 'number' ? value : Number.parseFloat(value);
      if (!Number.isNaN(nextValue)) updateStrokeWidth(nextValue);
    }

    function onQueryChange(value: string | number): void {
      query.value = String(value ?? '');
    }

    function selectIcon(id: string): void {
      const icon = iconMap.get(id);
      if (!icon) return;

      emitValue({
        library: icon.library,
        name: icon.name,
        strokeWidth: icon.library === 'lucide' ? currentStrokeWidth.value : undefined,
      });

      isOpen.value = false;
    }

    function toggleOpen(): void {
      isOpen.value = !isOpen.value;
    }

    function handleClickOutside(event: MouseEvent): void {
      if (!root.value) return;
      if (event.target instanceof Node && !root.value.contains(event.target)) {
        isOpen.value = false;
      }
    }

    onMounted(() => {
      document.addEventListener('mousedown', handleClickOutside);
    });

    onBeforeUnmount(() => {
      document.removeEventListener('mousedown', handleClickOutside);
    });

    return {
      IconRenderer,
      currentStrokeWidth,
      filteredIcons,
      isOpen,
      onLibraryChange,
      onQueryChange,
      onStrokeWidthChange,
      onStrokeWidthInputChange,
      query,
      root,
      selectIcon,
      selectedIcon,
      selectedIconId,
      selectedLibrary,
      strokeWidthDraft,
      strokeWidthInput,
      toggleOpen,
      value: props.value,
    };
  },
});
</script>

<style scoped>
.dreamui-icon-field {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dreamui-icon-field__toolbar {
  display: grid;
  grid-template-columns: minmax(180px, 220px) minmax(0, 1fr);
  gap: 12px;
}

.dreamui-icon-field__control {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dreamui-icon-field__label {
  color: var(--theme--foreground-subdued);
  font-size: 12px;
  font-weight: 600;
}

.dreamui-icon-field__native-select {
  min-height: 44px;
  border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
  border-radius: var(--theme--border-radius);
  background: var(--theme--form--field--input--background-subdued);
  color: var(--theme--foreground);
  padding: 0 12px;
}

.dreamui-icon-field__control--stroke {
  min-width: 0;
}

.dreamui-icon-field__stroke-controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96px;
  gap: 12px;
  align-items: center;
}

.dreamui-icon-field__dropdown {
  position: relative;
}

.dreamui-icon-field__trigger {
  width: 100%;
  min-height: 44px;
  border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
  border-radius: var(--theme--border-radius);
  background: var(--theme--form--field--input--background-subdued);
  color: var(--theme--foreground);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 12px;
  cursor: pointer;
  font: inherit;
}

.dreamui-icon-field__trigger--open {
  border-color: var(--theme--primary);
}

.dreamui-icon-field__trigger-value {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.dreamui-icon-field__trigger-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--theme--foreground);
}

.dreamui-icon-field__menu {
  position: absolute;
  inset-inline: 0;
  top: calc(100% + 8px);
  z-index: 20;
  border-radius: var(--theme--popover--menu--border-radius);
  background: var(--theme--popover--menu--background);
  box-shadow: var(--theme--popover--menu--box-shadow);
  border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
  overflow: hidden;
}

.dreamui-icon-field__icons {
  max-height: 420px;
  overflow: auto;
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(32px, 32px));
  gap: 12px;
  justify-content: start;
}

.dreamui-icon-field__icon-button {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--theme--foreground-subdued);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.dreamui-icon-field__icon-button:hover,
.dreamui-icon-field__icon-button--active {
  color: var(--theme--foreground);
  background: var(--theme--background-normal);
}

.dreamui-icon-field__search {
  padding: 12px;
  border-top: 1px solid var(--theme--form--field--input--border-color);
}

.dreamui-icon-field__empty {
  grid-column: 1 / -1;
  color: var(--theme--foreground-subdued);
  padding: 8px 0;
}

.dreamui-icon-field__value {
  font-size: 12px;
  color: var(--theme--foreground-subdued);
}

@media (max-width: 720px) {
  .dreamui-icon-field__toolbar,
  .dreamui-icon-field__stroke-controls {
    grid-template-columns: 1fr;
  }
}
</style>
