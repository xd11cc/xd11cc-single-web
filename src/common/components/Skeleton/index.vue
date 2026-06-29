<template>
  <div class="skeleton-wrapper" :class="{ 'is-animated': animated }">
    <slot v-if="!loading" />
    <template v-else>
      <slot name="skeleton">
        <div v-if="variant === 'card'" class="skeleton-card">
          <div class="skeleton-box skeleton-img"></div>
          <div class="skeleton-body">
            <div class="skeleton-box skeleton-title"></div>
            <div class="skeleton-box skeleton-text"></div>
            <div class="skeleton-box skeleton-text short"></div>
          </div>
        </div>

        <div v-else-if="variant === 'table'" class="skeleton-table">
          <div class="skeleton-box skeleton-table-header"></div>
          <div v-for="n in rows" :key="n" class="skeleton-table-row">
            <div
              v-for="c in columns"
              :key="c"
              class="skeleton-box skeleton-table-cell"
            ></div>
          </div>
        </div>

        <div v-else-if="variant === 'list'" class="skeleton-list">
          <div v-for="n in rows" :key="n" class="skeleton-list-item">
            <div class="skeleton-box skeleton-avatar"></div>
            <div class="skeleton-list-content">
              <div class="skeleton-box skeleton-title"></div>
              <div class="skeleton-box skeleton-text short"></div>
            </div>
          </div>
        </div>

        <div v-else class="skeleton-page">
          <div class="skeleton-box skeleton-heading"></div>
          <div class="skeleton-stats">
            <div v-for="n in 4" :key="n" class="skeleton-box skeleton-stat"></div>
          </div>
          <div class="skeleton-content-grid">
            <div class="skeleton-box skeleton-block"></div>
            <div class="skeleton-box skeleton-block small"></div>
          </div>
        </div>
      </slot>
    </template>
  </div>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    loading?: boolean
    animated?: boolean
    variant?: 'page' | 'card' | 'table' | 'list'
    rows?: number
    columns?: number
  }>(),
  {
    loading: true,
    animated: true,
    variant: 'page',
    rows: 5,
    columns: 4,
  },
)
</script>

<style lang="scss" scoped>
.skeleton-wrapper {
  width: 100%;
}

.skeleton-box {
  background: var(--theme-bg-elevated);
  border-radius: var(--p-radius-md);
  position: relative;
  overflow: hidden;
}

.is-animated .skeleton-box::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.08) 50%,
    transparent 100%
  );
  animation: skeleton-shimmer 1.5s infinite;
}

@keyframes skeleton-shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

// Page variant
.skeleton-page {
  padding: var(--p-space-6);
  max-width: 1200px;
  margin: 0 auto;

  .skeleton-heading {
    width: 200px;
    height: 28px;
    margin-bottom: var(--p-space-6);
  }

  .skeleton-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--p-space-4);
    margin-bottom: var(--p-space-6);
  }

  .skeleton-stat {
    height: 100px;
    border-radius: var(--card-radius);
  }

  .skeleton-content-grid {
    display: grid;
    grid-template-columns: 1.6fr 1fr;
    gap: var(--p-space-4);
  }

  .skeleton-block {
    height: 280px;
    border-radius: var(--card-radius);

    &.small {
      height: 280px;
    }
  }
}

// Card variant
.skeleton-card {
  border-radius: var(--card-radius);
  border: 1px solid var(--theme-border);
  overflow: hidden;

  .skeleton-img {
    width: 100%;
    height: 160px;
    border-radius: 0;
  }

  .skeleton-body {
    padding: var(--p-space-4);
    display: flex;
    flex-direction: column;
    gap: var(--p-space-3);
  }

  .skeleton-title {
    width: 60%;
    height: 18px;
  }

  .skeleton-text {
    width: 100%;
    height: 14px;

    &.short {
      width: 40%;
    }
  }
}

// Table variant
.skeleton-table {
  border: 1px solid var(--theme-border);
  border-radius: var(--card-radius);
  overflow: hidden;

  .skeleton-table-header {
    height: 44px;
    border-radius: 0;
    background: var(--theme-bg-surface);
  }

  .skeleton-table-row {
    display: flex;
    gap: var(--p-space-3);
    padding: 12px 16px;
    border-top: 1px solid var(--theme-border);
  }

  .skeleton-table-cell {
    flex: 1;
    height: 16px;

    &:first-child {
      flex: 0.5;
    }

    &:last-child {
      flex: 0.7;
    }
  }
}

// List variant
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-4);
}

.skeleton-list-item {
  display: flex;
  gap: var(--p-space-3);
  align-items: center;

  .skeleton-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .skeleton-list-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--p-space-2);

    .skeleton-title {
      width: 50%;
      height: 14px;
    }

    .skeleton-text {
      width: 30%;
      height: 12px;
    }
  }
}
</style>
