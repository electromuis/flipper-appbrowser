<template>
    <b-button v-if="status" :variant="disabled" disabled>{{ status }}</b-button>
    <b-button v-else @click="install()">
        Install

        <font-awesome-icon :icon="['fas', 'microchip']" />
    </b-button>
</template>

<script>
import * as flipper from './flipper/core'
import { ref } from 'vue'
import asyncSleep from 'simple-async-sleep'

export default {
    props: ['app'],

    setup () {
        return {
            flipper: ref(flipper)
        }
    },

    data() {
        return {
            status: null,
        }
    },

    methods: {
        async install() {
            const app = this.$props.app
            try {
                this.status = 'Building'

                const response = await fetch(`/build/${app.author}/${app.title}`, {redirect: 'manual'})
                
                if(response.status != 200) {
                    this.status = 'Build failed'
                    return
                }
                const header = response.headers.get('Content-Disposition');
                const parts = header.split(';');
                const filename = parts[1].split('=')[1];
                const filedata = await response.arrayBuffer()

                this.status = 'Connecting to flipper'
                try {
                    this.flipper.connect()
                } catch(e) {
                    this.status = 'Connecting failed'
                    return
                }
                
                const ping = await this.flipper.commands.startRpcSession(this.flipper)
                if (!ping.resolved || ping.error) {
                    throw new Error('Couldn\'t start rpc session')
                }

                let res = await this.flipper.commands.system.deviceInfo()
                console.log(res)
                res = await this.flipper.commands.system.powerInfo()
                console.log(res)

                this.status = 'Uploading app'
                let filepath = '/ext/apps/'
                if(app.category) {
                    filepath += app.category + '/'
                }
                filepath += filename
                res = await this.flipper.commands.storage.write(filepath, filedata)
                
                this.status = 'Disconnecting'
                this.flipper.closeReader()
                await asyncSleep(300)
                this.status = null

            } finally {
                this.flipper.disconnect()
            }
        }
    }
}
</script>