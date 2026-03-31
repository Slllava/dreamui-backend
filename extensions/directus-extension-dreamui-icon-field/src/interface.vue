<template>
  <div class="dreamui-icon-field">
    <div class="dreamui-icon-field__toolbar">
      <label class="dreamui-icon-field__control">
        <span class="dreamui-icon-field__label">Library</span>
        <select :value="selectedLibrary" class="dreamui-icon-field__input" @change="onLibraryChange">
          <option value="lucide">Lucide</option>
          <option value="remix">Remix Icon</option>
        </select>
      </label>

      <label class="dreamui-icon-field__control dreamui-icon-field__control--search">
        <span class="dreamui-icon-field__label">Search</span>
        <input
          :value="query"
          type="search"
          class="dreamui-icon-field__input"
          placeholder="Search icons"
          @input="onQueryInput"
        />
      </label>

      <label v-if="selectedLibrary === 'lucide'" class="dreamui-icon-field__control">
        <span class="dreamui-icon-field__label">Stroke width</span>
        <input
          :value="String(currentStrokeWidth)"
          type="number"
          min="0.5"
          max="4"
          step="0.25"
          class="dreamui-icon-field__input"
          @input="onStrokeWidthInput"
        />
      </label>
    </div>

    <div class="dreamui-icon-field__summary">
      <div class="dreamui-icon-field__preview" :class="{ 'dreamui-icon-field__preview--empty': !selectedIcon }">
        <component
          v-if="selectedIcon"
          :is="IconRenderer"
          :icon="selectedIcon"
          :size="26"
          :stroke-width="currentStrokeWidth"
        />
        <span v-else>No icon selected</span>
      </div>

      <div class="dreamui-icon-field__meta">
        <strong>{{ selectedIconLabel }}</strong>
        <code class="dreamui-icon-field__code">{{ serializedValue }}</code>
      </div>

      <button
        v-if="value"
        type="button"
        class="dreamui-icon-field__clear"
        @click="clearValue"
      >
        Clear
      </button>
    </div>

    <div class="dreamui-icon-field__grid">
      <button
        v-for="icon in filteredIcons"
        :key="icon.id"
        type="button"
        class="dreamui-icon-field__tile"
        :class="{ 'dreamui-icon-field__tile--active': icon.id === selectedIconId }"
        @click="selectIcon(icon.id)"
      >
        <div class="dreamui-icon-field__tile-icon">
          <component :is="IconRenderer" :icon="icon" :size="20" :stroke-width="currentStrokeWidth" />
        </div>
        <span>{{ icon.label }}</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import type { Component, PropType } from 'vue';
import { computed, defineComponent, h, ref } from 'vue';
import * as lucideIcons from 'lucide';
import * as remixIcons from '@remixicon/vue';

type IconLibrary = 'lucide' | 'remix';

type StoredValue = {
  library: IconLibrary;
  name: string;
  strokeWidth?: number;
};

type IconOption = {
  id: string;
  label: string;
  library: IconLibrary;
  name: string;
  component?: Component;
  iconNode?: [string, Record<string, string>][];
};

const DEFAULT_STROKE_WIDTH = 2;

const LucideRenderer = defineComponent({
  name: 'LucideRenderer',
  props: {
    iconNode: {
      type: Array as PropType<[string, Record<string, string>][]> ,
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
  return name
    .replace(/Icon$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/-/g, ' ')
    .trim();
}

function toRemixLabel(name: string): string {
  return name
    .replace(/^Ri/, '')
    .replace(/Icon$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim();
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
    iconNode: iconNode as [string, Record<string, string>][],
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
      return {
        library: 'lucide',
        name: value,
        strokeWidth: DEFAULT_STROKE_WIDTH,
      };
    }

    if (remixNames.has(value)) {
      return {
        library: 'remix',
        name: value,
      };
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
    const parsedValue = computed(() => safeParseValue(props.value));
    const query = ref('');

    const selectedLibrary = computed<IconLibrary>(() => parsedValue.value?.library ?? 'lucide');
    const currentStrokeWidth = computed(() => parsedValue.value?.strokeWidth ?? DEFAULT_STROKE_WIDTH);
    const selectedIconId = computed(() => {
      const parsed = parsedValue.value;
      return parsed ? `${parsed.library}:${parsed.name}` : '';
    });

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

    const selectedIcon = computed(() => iconMap.get(selectedIconId.value) ?? null);
    const selectedIconLabel = computed(() => {
      if (!selectedIcon.value) return 'No icon selected';
      return `${selectedIcon.value.label} (${selectedLibrary.value})`;
    });

    const serializedValue = computed(() => {
      if (!props.value) return 'null';
      return props.value;
    });

    function emitValue(next: StoredValue | null): void {
      emit('input', next ? JSON.stringify(next) : null);
    }

    function onLibraryChange(event: Event): void {
      const target = event.target as HTMLSelectElement;
      const nextLibrary = target.value === 'remix' ? 'remix' : 'lucide';
      const source = nextLibrary === 'lucide' ? lucideList : remixList;
      const firstIcon = source[0];

      emitValue({
        library: nextLibrary,
        name: firstIcon?.name ?? '',
        strokeWidth: nextLibrary === 'lucide' ? currentStrokeWidth.value : undefined,
      });
    }

    function onQueryInput(event: Event): void {
      query.value = (event.target as HTMLInputElement).value;
    }

    function onStrokeWidthInput(event: Event): void {
      const target = event.target as HTMLInputElement;
      const nextValue = Number.parseFloat(target.value);
      const parsed = parsedValue.value;

      if (!parsed || parsed.library !== 'lucide' || Number.isNaN(nextValue)) return;

      emitValue({
        ...parsed,
        strokeWidth: nextValue,
      });
    }

    function selectIcon(id: string): void {
      const icon = iconMap.get(id);
      if (!icon) return;

      emitValue({
        library: icon.library,
        name: icon.name,
        strokeWidth: icon.library === 'lucide' ? currentStrokeWidth.value : undefined,
      });
    }

    function clearValue(): void {
      emit('input', null);
    }

    return {
      clearValue,
      currentStrokeWidth,
      filteredIcons,
      IconRenderer,
      onLibraryChange,
      onQueryInput,
      onStrokeWidthInput,
      query,
      selectIcon,
      selectedIcon,
      selectedIconId,
      selectedIconLabel,
      selectedLibrary,
      serializedValue,
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.dreamui-icon-field__control {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dreamui-icon-field__control--search {
  grid-column: span 1;
}

.dreamui-icon-field__label {
  color: var(--theme--foreground-subdued);
  font-size: 12px;
  font-weight: 600;
}

.dreamui-icon-field__input {
  width: 100%;
  min-height: 44px;
  border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
  border-radius: var(--theme--border-radius);
  padding: 0 12px;
  background: var(--theme--form--field--input--background-subdued);
  color: var(--theme--foreground);
  font-family: var(--theme--fonts--sans--font-family);
  font-size: 14px;
  outline: none;
  transition: border-color var(--fast) var(--transition), background-color var(--fast) var(--transition);
}

.dreamui-icon-field__input:hover {
  border-color: var(--theme--form--field--input--border-color-hover);
}

.dreamui-icon-field__input:focus {
  border-color: var(--theme--form--field--input--border-color-focus);
  background: var(--theme--background-input);
}

.dreamui-icon-field__summary {
  display: flex;
  align-items: center;
  gap: 12px;
  border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
  border-radius: calc(var(--theme--border-radius) + 4px);
  padding: 12px;
  background: var(--theme--form--field--input--background-subdued);
}

.dreamui-icon-field__preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: var(--theme--border-radius);
  background: var(--theme--background-page);
  color: var(--theme--foreground);
  flex-shrink: 0;
  border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
}

.dreamui-icon-field__preview--empty {
  width: auto;
  min-width: 52px;
  padding: 0 12px;
  color: var(--theme--foreground-subdued);
  font-size: 12px;
}

.dreamui-icon-field__meta {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.dreamui-icon-field__code {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}

.dreamui-icon-field__clear {
  border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
  border-radius: 999px;
  padding: 8px 12px;
  background: var(--theme--background-page);
  color: var(--theme--foreground);
  cursor: pointer;
  font: inherit;
}

.dreamui-icon-field__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
  gap: 8px;
  max-height: 440px;
  overflow: auto;
  padding-right: 4px;
}

.dreamui-icon-field__tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 88px;
  border: var(--theme--border-width) solid transparent;
  border-radius: calc(var(--theme--border-radius) + 2px);
  background: transparent;
  color: var(--theme--foreground);
  cursor: pointer;
  padding: 10px 8px;
  text-align: center;
  font-size: 12px;
  transition: background-color var(--fast) var(--transition), border-color var(--fast) var(--transition), color var(--fast) var(--transition);
}

.dreamui-icon-field__tile:hover {
  background: var(--theme--background-highlight);
}

.dreamui-icon-field__tile-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--theme--border-radius);
  background: var(--theme--background-page);
  border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
}

.dreamui-icon-field__tile--active {
  border-color: var(--theme--primary);
  background: var(--theme--primary-background);
}

.dreamui-icon-field__tile--active .dreamui-icon-field__tile-icon {
  border-color: var(--theme--primary);
}

@media (max-width: 720px) {
  .dreamui-icon-field__toolbar {
    grid-template-columns: 1fr;
  }
}
</style>
