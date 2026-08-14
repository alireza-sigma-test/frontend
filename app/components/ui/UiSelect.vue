<script setup lang="ts">
defineProps<{ modelValue: string; label: string; options: { value: string; label: string }[] }>()
defineEmits<{ 'update:modelValue': [string] }>()
const id = useId()
</script>
<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="t-label text-ink">{{ label }}</label>
    <select
      :id="id" :value="modelValue"
      class="rounded-control bg-sunken border border-rule-strong px-3 h-[38px] t-body text-ink"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
  </div>
</template>
