<template>
  <div style="display: flex; flex-direction: column; align-items: center; margin-top: 30px;" class="container">
    <b-modal v-model="modalOpen">
      <VueMarkdown v-if="modal" :source="modal" />
    </b-modal>

    <h1 style="margin-bottom: 30px;">Flipper App Browser</h1>

    <b-form-input v-model="searchQuery" placeholder="Search ..." class="mb-4"></b-form-input>

    <b-pagination
        v-model="currentPage"
        :total-rows="numApps"
        :per-page="perPage"
      ></b-pagination>
    
    <b-table
      style="width: 100%"
      :provider="appsLoader"
      :current-page="currentPage"
      :sort-by="sortBy"
      :sort-desc="sortDesc"
      :fields="fields"
      :filter="searchQueryCooldown"
      @sorted="setSort"
      ref="mytable"

      hover caption-top responsive striped>

      <template #cell(title)="data">
        <div style="display: flex; align-items: center;">
          <img v-if="data.item.icon" :src="data.item.icon" style="margin: 10px; margin-right: 30px; height: 50px; width: 50px; image-rendering: pixelated;" />

          <a :href="`https://github.com/${data.item.author}/${data.item.title}`" target="_blank">
            {{ data.item.title }}
          </a>
        </div>
      </template>

      <template #cell(description)="data">
        <template v-if="data.item.description">
            <span style="font-size: small; max-width: 400px; display: block;">{{ data.item.description }}</span>
          </template>
      </template>

      <template #cell(author)="data">
        <div style="display: flex; align-items: center;">
          <b-avatar v-if="data.item.author_icon" :src="data.item.author_icon" style="margin: 10px;" size="5rem" />
          
          <a :href="`https://github.com/${data.item.author}`" target="_blank">{{ data.item.author }}</a>
        </div>
      </template>

      <template #cell(download)="data">
        <div style="display: flex; flex-direction: column;">
          <b-button variant="primary" :href="`/build/${data.item.author}/${data.item.title}`" style="margin: 10px">
            Download
          </b-button>

          <InstallButton style="margin: 10px" :app="data.item" />

          <b-button v-if="data.item.readme" @click="modal = data.item.readme; modalOpen = true;" style="margin: 10px">Readme</b-button>
        </div>
      </template>
    
    </b-table>
    <b-pagination
        v-model="currentPage"
        :total-rows="numApps"
        :per-page="perPage"
      ></b-pagination>

    <a href="https://github.com/electromuis/flipper-appbrowser" target="_blank"><h2>https://github.com/electromuis/flipper-appbrowser</h2></a>
  </div>
</template>

<script>
import VueMarkdown from 'vue-markdown-render'
import InstallButton from './InstallButton.vue'
import _ from 'lodash'

export default {
  name: 'App',
  components: {
    VueMarkdown,
    InstallButton
  },

  created() {
    const me = this
    me.$watch('searchQuery', _.debounce(() => {
        me.searchQueryCooldown = me.searchQuery
    }, 200))
  },

  methods: {
    async appsLoader(ctx) {
      console.log(ctx)
      const response = await fetch(`/apps.json?page=${ctx.currentPage}&per_page=${this.perPage}&sort_by=${this.sortBy}&sort_dir=${this.sortDesc}&query=${this.searchQueryCooldown}`)
      const responseJson = await response.json()
      this.numApps = responseJson.total
      return responseJson.items
    },
    setSort(e) {
      if(e == this.sortBy) {
        this.sortDesc = !this.sortDesc
      } else {
        this.sortDesc = false
        this.sortBy = e
      }
    }
  },
  data() {
    return {
      searchQuery: '',
      searchQueryCooldown: '',
      items: [
        {
          title: 'Flipper-Plugin-Tutorial',
          author: 'electromuis'
        }
      ],
      fields: [
        {
          key: 'title',
          sortable: true
        },
        {
          key: 'description',
        },
        {
          key: 'category'
        },
        {
          key: 'stars',
          sortable: true
        },
        {
          key: 'downloads',
          sortable: true
        },
        {
          key: 'author',
          sortable: true
        },
        {
          key: 'download'
        },
      ],
      // fields: ['title', 'description', 'category', 'stars', 'downloads', 'author', 'download'],
      perPage: 10,
      currentPage: 1,
      numApps: 0,
      modal: null,
      modalOpen: false,

      sortBy: 'title',
      sortDesc: false
    }
  }
}
</script>
