<script setup lang="ts">
defineProps<{ modelValue: string; options: { value: string; label: string; description: string }[] }>()
defineEmits<{ 'update:modelValue': [string] }>()
const name = useId()
</script>
<template>
  <div class="flex flex-col gap-2">
    <label
      v-for="o in options" :key="o.value"
      class="flex gap-3 items-start rounded-control border p-3 cursor-pointer transition-colors"
      :class="modelValue === o.value ? 'border-terracotta bg-card' : 'border-rule bg-sunken hover:bg-card'"
    >
      <input
        type="radio" :name="name" :value="o.value" :checked="modelValue === o.value" class="mt-1 accent-[var(--color-terracotta)]"
        @change="$emit('update:modelValue', o.value)"
      >
      <span>
        <span class="t-label text-ink block">{{ o.label }}</span>
        <span class="t-body text-ink-45 block">{{ o.description }}</span>
      </span>
    </label>
  </div>
</template>
