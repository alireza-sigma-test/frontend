<template>
  <div class="min-h-screen grid lg:grid-cols-2">
    <aside class="hidden lg:flex flex-col justify-center bg-sunken px-14 border-r border-rule">
      <p class="t-eyebrow text-ink-70">Proposal Review</p>
      <h1 class="t-display text-ink mt-4">Good talks start as rough ideas.</h1>
      <p class="t-lead text-ink-70 mt-5 max-w-[46ch]">
        Submit a proposal, get read by real reviewers, and see exactly where it stands.
      </p>
      <!-- Static copy: the design's marketing panel shows 248 / 31, and there
           is no stats endpoint to source live numbers from. -->
      <div class="flex gap-10 mt-12">
        <div>
          <p class="t-title text-ink">248</p>
          <p class="t-label text-ink-45 mt-0.5">proposals this year</p>
        </div>
        <div>
          <p class="t-title text-ink">31</p>
          <p class="t-label text-ink-45 mt-0.5">reviewers reading</p>
        </div>
      </div>
    </aside>
    <main class="flex items-center justify-center px-6 py-12"><div class="w-full max-w-[26rem]"><slot /></div></main>
  </div>
</template>
