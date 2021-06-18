<template>
  <div v-tooltip="hash" class="hashCell pointer">
    <a :href="sacnUrl" target="_blank" rel="noopener nofollow noreferrer">
      {{ hash }}
    </a>
  </div>
</template>

<script>
import api from '../../api/index'
export default {
  name: 'HashCell',
  props: {
    address: {
      type: String,
      default: ''
    },
    num: {
      type: Number,
      default: 0
    },
    side: {
      type: String,
      default: 'left'
    }
  },
  data() {
    return {
      hash: '',
      preUrl: ''
    }
  },
  computed: {
    sacnUrl() {
      return this.preUrl + this.hash
    }
  },
  mounted() {
    this.queryHash()
    this.preUrl = process.env.VUE_APP_SCANURL
    console.log(process.env.VUE_APP_SCANURL)
  },
  methods: {
    queryHash() {
      api.queryHash(this.side, this.address, this.num).then(res => {
        this.hash = res.data
      })
    }
  }
}
</script>
<style lang="scss" scoped>
.hashCell {
  text-align: center;
  max-width: 6rem;
  overflow: hidden;
  text-overflow: ellipsis;
  a {
    color: rgb(31, 219, 233);
  }
}
</style>
