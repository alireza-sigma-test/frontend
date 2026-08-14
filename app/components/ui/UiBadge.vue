<script setup lang="ts">
import type { Status } from '~/types/api'
const props = defineProps<{ status: Status }>()

const styles: Record<Status, string> = {
  pending:  'bg-pending-bg text-pending-fg border-pending-br',
  approved: 'bg-approved-bg text-approved-fg border-approved-br',
  rejected: 'bg-rejected-bg text-rejected-fg border-rejected-br',
}
const labels: Record<Status, string> = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' }
</script>

<template>
  <span class="rounded-badge border px-2 py-0.5 t-label inline-flex items-center gap-1.5" :class="styles[status]">
    <span class="w-1.5 h-1.5 rounded-full bg-current opacity-60" aria-hidden="true" />
    {{ labels[status] }}
  </span>
</template>
