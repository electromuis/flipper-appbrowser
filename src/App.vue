<template>
  <b-pagination
      v-model="currentPage"
      :total-rows="rows"
      :per-page="perPage"
      aria-controls="my-table"
  ></b-pagination>

  <b-table 
    hover small caption-top responsive
    :items="apps"
    :fields="fields"

    :per-page="perPage"
    :current-page="currentPage"
  >
    <template #cell:user="row">
        <a target="_blank" :href="'http://github.com/' + row.item.user" style="display: flex; align-items: center;">
          <img v-if="row.item.avatar" :src="row.item.avatar" style="max-width: 50px; max-height: 50px; margin-right: 20px;" />
          {{ row.data }}
        </a>
    </template>

    <template #cell:repo="row">
        <a target="_blank" :href="'http://github.com/' + row.item.user + '/' + row.item.repo">
          http://github.com/{{row.item.user}}/{{row.item.repo}}
        </a>
    </template>

    <template #cell:download="row">
        <a target="_blank" :href="'/build/' + row.item.user + '/' + row.item.repo">
          Download
        </a>
    </template>
  </b-table>
</template>

<script>

export default {
  name: 'App',
  components: {
  },
  async created() {
    let apps = await fetch('/apps.json')
    this.apps = await apps.json()
    this.loading = false
  },
  data() {
    return {
      fields: [
        {
          key: 'user',
          label: 'User'
        },
        {
          key: 'repo',
          label: 'Repository'
        },
        {
          key: 'download',
          label: 'Download'
        }
      ],
      apps: [],
      loading: true,
      perPage: 10,
      currentPage: 1
    }
  }
}
</script>
