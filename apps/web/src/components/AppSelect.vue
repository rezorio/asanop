<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

export type SelectOption = {
  value: string | number
  label: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null
    options: SelectOption[]
    placeholder?: string
    disabled?: boolean
    variant?: 'default' | 'sidebar' | 'compact'
  }>(),
  {
    placeholder: 'Select…',
    disabled: false,
    variant: 'default',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const open = ref(false)
const triggerEl = ref<HTMLButtonElement | null>(null)
const menuEl = ref<HTMLUListElement | null>(null)
const menuStyle = ref({ top: '0px', left: '0px', width: '0px' })

const active = computed(() =>
  props.options.find((option) => option.value === props.modelValue),
)

const triggerLabel = computed(() => active.value?.label ?? props.placeholder)

const triggerClass = computed(() => {
  switch (props.variant) {
    case 'sidebar':
      return 'app-select-trigger app-select-trigger-sidebar'
    case 'compact':
      return 'app-select-trigger app-select-trigger-compact'
    default:
      return 'app-select-trigger'
  }
})

const menuClass = computed(() => {
  switch (props.variant) {
    case 'sidebar':
      return 'app-select-menu app-select-menu-sidebar'
    default:
      return 'app-select-menu'
  }
})

function isSelected(value: string | number) {
  return props.modelValue === value
}

function updatePosition() {
  if (!triggerEl.value) return
  const rect = triggerEl.value.getBoundingClientRect()
  menuStyle.value = {
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  }
}

function toggle() {
  if (props.disabled) return
  open.value = !open.value
}

function select(value: string | number) {
  emit('update:modelValue', value)
  open.value = false
}

function onClickOutside(event: MouseEvent) {
  const target = event.target as Node
  if (triggerEl.value?.contains(target)) return
  if (menuEl.value?.contains(target)) return
  open.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    open.value = false
  }
}

function onScrollOrResize() {
  if (open.value) {
    updatePosition()
  }
}

watch(open, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    updatePosition()
  }
})

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', onScrollOrResize)
  window.addEventListener('scroll', onScrollOrResize, true)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', onScrollOrResize)
  window.removeEventListener('scroll', onScrollOrResize, true)
})
</script>

<template>
  <div class="app-select">
    <button
      ref="triggerEl"
      type="button"
      :class="[triggerClass, open ? 'app-select-trigger-open' : '', disabled ? 'app-select-trigger-disabled' : '']"
      :disabled="disabled"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click.stop="toggle"
    >
      <span class="truncate" :class="!active ? 'text-muted' : ''">{{ triggerLabel }}</span>
      <ChevronDown
        class="app-select-chevron shrink-0"
        :class="open ? 'rotate-180' : ''"
        aria-hidden="true"
      />
    </button>

    <Teleport to="body">
      <ul
        v-if="open"
        ref="menuEl"
        role="listbox"
        :class="menuClass"
        :style="menuStyle"
      >
        <li v-for="option in options" :key="String(option.value)" role="presentation">
          <button
            type="button"
            role="option"
            class="app-select-option"
            :class="[
              isSelected(option.value) ? 'app-select-option-active' : '',
              variant === 'sidebar' ? 'app-select-option-sidebar' : '',
            ]"
            :aria-selected="isSelected(option.value)"
            :disabled="option.disabled"
            @click="select(option.value)"
          >
            <span class="truncate">{{ option.label }}</span>
          </button>
        </li>
      </ul>
    </Teleport>
  </div>
</template>
