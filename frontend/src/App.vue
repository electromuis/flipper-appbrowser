<template>
  <div style="display: flex; flex-direction: column; align-items: center; margin-top: 30px;" class="container">
    <b-modal size="lg" v-model="modalOpen" ok-only ok-title="Close">
      <VueMarkdown v-if="modal" :source="modal" />
    </b-modal>

    <h1 style="margin-bottom: 30px;">Flipper App Browser</h1>
    
    <b-alert v-if="message" :modelValue="true" variant="danger" dismissible>
      {{ message }}
    </b-alert>

    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 18px;">
      <b-form-input v-model="searchQuery" placeholder="Search ..." style="width: 400px;"></b-form-input>

      Sort:
    
      <b-form-select id="sortBy" :options="sortOptions" v-model="sortBy" />
    </div>

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
            <span style="font-size: small; max-width: 300px; display: block;">{{ data.item.description }}</span>

            <b-button v-if="data.item.readme" @click="modal = markdownFix(data.item.readme, data.item); modalOpen = true;" style="margin-top: 10px">More</b-button>
        </template>
      </template>

      <template #cell(stats)="data">
        <font-awesome-icon :icon="['fas', 'download']" /> {{ data.item.downloads }} <br/>
        <font-awesome-icon :icon="['fas', 'star']" /> {{ data.item.stars }} <br/>
        <font-awesome-icon :icon="['fas', 'circle-exclamation']" /> {{ data.item.issues }}<br/>
        <font-awesome-icon :icon="['fas', 'person-walking']" /> {{ data.item.issues }}<br/>
      </template>

      <template #cell(author)="data">
        <div style="display: flex; align-items: center;">
          <b-avatar v-if="data.item.author_icon" :src="data.item.author_icon" style="margin: 10px;" size="5rem" />
          
          <a :href="`https://github.com/${data.item.author}`" target="_blank">{{ data.item.author }}</a>
        </div>
      </template>

      <template #cell(download)="data">
        <div style="display: flex; flex-direction: column;">

          <template v-if="data.item.building === false">
            This app failed building<br/>
            <b-button @click="data.item.building = true" style="margin: 10px" variant="dark">Try anyway</b-button>
          </template>

          <template v-else>
            <b-button variant="primary" :href="`/build/${data.item.author}/${data.item.title}`" target="_blank" style="margin: 10px">
              Download

              <font-awesome-icon :icon="['fas', 'floppy-disk']" />
            </b-button>

            <InstallButton style="margin: 10px" :app="data.item" />
          </template>
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

    const params = new URLSearchParams(window.location.search);
    this.message = params.get('message')
  },

  watch: {
    sortBy() {
      this.currentPage = 1
    }
  },

  methods: {
    markdownFix(input, app) {
      const regex = /\[([\w\s\d]+)\]\s*\((?!https?:)\/?([\w/\].]+)\)/gm;
      const subst = `[$1](https://raw.githubusercontent.com/${app.author}/${app.title}/${app.main_branch}/$2)`;

      input = input.replace(regex, subst);

      return input
    },

    async appsLoader(ctx) {
      console.log(ctx)
      const response = await fetch(`/apps.json?page=${ctx.currentPage}&per_page=${this.perPage}&sort_by=${this.sortBy}&sort_dir=${this.sortDesc}&query=${this.searchQueryCooldown}`)
      const responseJson = await response.json()
      this.numApps = responseJson.total
      return responseJson.items
    },
    setSort(e) {
      this.sortBy = e

      // if(e == this.sortBy) {
      //   this.sortDesc = !this.sortDesc
      // } else {
      //   this.sortDesc = false
      //   this.sortBy = e
      // }
    }
  },
  data() {
    return {
      message: null,
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
          // sortable: true
        },
        {
          key: 'description',
        },
        {
          key: 'category'
        },
        {
          key: 'stats'
        },
        {
          key: 'author',
          // sortable: true
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
      sortDesc: false,
      sortOptions: [
        {value: 'title', text: 'Title'},
        {value: 'author', text: 'Author'},
        {value: 'downloads', text: 'Downloads'},
        {value: 'stars', text: 'Stars'},
      ]
    }
  }
}
</script>
