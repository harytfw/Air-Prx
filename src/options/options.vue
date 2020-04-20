

<template>
  <div>
    <button @click="val += 1">Add</button>
    <p>{{ val }}</p>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  data() {
    return {
      val: 0,
      sssd: 0
    };
  },
  mounted() {
    console.log("mounted");
  }
});
</script>
<style>
</style>