<template>
  <div class="image-preview" @click="$emit('click')" @keydown="$emit('click')">
    <div class="image">
      <img alt="preview of choosable image" :src="src">
    </div>
    <dl class="info">
      <dt>{{title}}</dt>
    </dl>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    src: { type: String },
    title: { type: String },
  },
  emits: [
    'click',
  ],
});
</script>
