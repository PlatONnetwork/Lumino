<template>
  <div class="download-box">
    <img class="bg" src="../assets/images/2.bg.png" alt="bg" />
    <div class="tabs-box">
      <div class="left">
        <span
          class="tab pointer"
          :class="curTab === 'data' ? 'active' : ''"
          @click="curTab = 'data'"
        >
          Data
        </span>
        <span
          class="tab pointer"
          :class="curTab === 'signature' ? 'active' : ''"
          @click="curTab = 'signature'"
        >
          Signature
        </span>
      </div>
      <div class="right">
        <span class="s-tab total">Total : {{ total }}</span>
        <span class="s-tab address">Address : {{ address }}</span>
        <span class="s-tab backFont pointer" @click="backFn">Back</span>
      </div>
    </div>
    <div class="table-wraper">
      <table
        v-if="curTab === 'data'"
        width="100%"
        border="0"
        cellspacing="0"
        cellpadding="10"
        class="table-box"
      >
        <thead class="t-head">
          <tr>
            <td
              v-for="title in titleList"
              :key="title.index"
              class="h-cell"
              :class="{
                'hash-cell': title.name === 'link',
                'file-cell': title.name === 'file',
                'num-cell': title.name === 'index',
                'size-cell': title.name === 'size',
              }"
            >
              {{ title.label }}
            </td>
          </tr>
        </thead>
        <tbody class="t-body">
          <tr v-for="(item, index) in dataAry" :key="index" class="b-line">
            <td class="b-cell num-cell">{{ item.num }}</td>
            <td class="b-cell file-cell">
              <a
                :href="`${
                  whichSide === 'left' ? '/api' : '/right-api'
                }/data/${address}/file_${item.num}.${
                  curTab === 'data' ? 'dat' : 'sig'
                }`"
                target="_blank"
                rel="noreferrer nofollow"
              >
                {{ item.name }}
              </a>
            </td>
            <td class="b-cell size-cell">{{ item.size | sizeFilter }}</td>
            <td class="b-cell hash-cell">
              <HashCell :address="address" :side="whichSide" :num="item.num" />
            </td>
          </tr>
        </tbody>
      </table>
      <table
        v-else
        width="100%"
        border="0"
        cellspacing="0"
        cellpadding="10"
        class="table-box"
      >
        <thead class="t-head">
          <tr>
            <td
              v-for="title in titleList"
              :key="title.index"
              class="h-cell"
              :class="{
                'hash-cell': title.name === 'link',
                'file-cell': title.name === 'file',
                'num-cell': title.name === 'index',
                'size-cell': title.name === 'size',
              }"
            >
              {{ title.label }}
            </td>
          </tr>
        </thead>
        <tbody class="t-body">
          <tr v-for="(item, index) in signatureAry" :key="index" class="b-line">
            <td class="b-cell num-cell">{{ item.num }}</td>
            <td class="b-cell file-cell">
              <a
                :href="`${
                  whichSide === 'left' ? '/api' : '/right-api'
                }/signature/${address}/${item.num}`"
                target="_blank"
                rel="noreferrer nofollow"
              >
                {{ item.name }}
              </a>
            </td>
            <td class="b-cell size-cell">{{ item.size | sizeFilter }}</td>
            <td class="b-cell hash-cell">
              <HashCell :address="address" :side="whichSide" :num="item.num" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="foot-box">
      <img src="../assets/images/logo.svg" alt="" />
      <p class="copyright">Copyright ©{{ curYear }} ALAYA NETWORK</p>
    </div>
  </div>
</template>
<script>
import api from '../api/index'
import { sizeToStr } from '../utils/utils'
import HashCell from './components/HashCell'
export default {
  name: 'Download',
  filters: {
    sizeFilter: function (size) {
      if (!size) return '0.00k'
      return sizeToStr(size)
    }
  },
  components: {
    HashCell
  },
  data() {
    return {
      curYear: '',
      curTab: 'data',
      dataAry: [],
      signatureAry: [],
      titleList: [
        {
          index: 0,
          name: 'index',
          label: 'Index'
        },
        {
          index: 1,
          name: 'file',
          label: 'FlieName'
        },
        { index: 2, name: 'size', label: 'FileSize' },
        { index: 3, name: 'link', label: 'BlockChain-Hash' }
      ]
    }
  },

  computed: {
    address() {
      return this.$route.query.address
    },
    total() {
      return this.$route.query.total
    },
    whichSide() {
      return this.$route.query.whichSide
    }
  },
  mounted() {
    console.log(process.env)
    this.initialFn()
    this.queryYear()
  },
  methods: {
    queryYear() {
      this.curYear = new Date().getFullYear()
    },
    backFn() {
      this.$router.push({
        name: 'home'
      })
    },
    async initialFn() {
      let res = {}
      if (this.whichSide === 'left') {
        res = await api.downloadList(this.address)
      } else {
        res = await api.downloadRightList(this.address)
      }
      const originalData = res.data
      originalData.forEach(item => {
        if (item.name.split('.')[1] === 'dat') {
          this.dataAry.push(item)
        } else if (item.name.split('.')[1] === 'sig') {
          this.signatureAry.push(item)
        }
      })
    }
  }
}
</script>
<style lang="scss" scoped>
.download-box {
  // background-image: url("../assets/images/2.bg.png") no-repeat;
  background-size: 100% 100%;
  box-sizing: border-box;
  width: 100%;
  height: 100vh;
  background: #030303;
  color: #ffffff;
  position: relative;
  padding: 50px 100px 20px;
  position: relative;
  z-index: 10;
  .bg {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: -1;
  }
  .tabs-box {
    width: 100%;
    height: 34px;
    margin-bottom: 26px;
    display: flex;
    justify-content: space-between;
    .tab {
      height: 33px;
      font-family: PingFangSC-Medium;
      font-size: 24px;
      color: #ffffff;
      letter-spacing: 0;
      font-weight: 500;
      position: relative;
      &:nth-child(2) {
        margin-left: 72px;
      }
    }
    .s-tab {
      font-family: PingFangSC-Medium;
      font-size: 16px;
      color: #ffffff;
      letter-spacing: 0;
      font-weight: 500;
      padding-left: 40px;
      &.backFont {
        color: rgb(31, 219, 233);
      }
    }
    & .active {
      color: rgb(31, 219, 233);
      // border-bottom: 2px solid #3dbbbb;
      &::after {
        content: "";
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 66.66%;
        background-color: rgb(31, 219, 233);
        height: 2px;
      }
    }
    .left,
    .right {
      display: flex;
      align-items: center;
    }
  }
  .table-wraper {
    width: 100%;
    height: calc(100vh - 200px);
    border-radius: 9px;
    // padding: 20px 50px;
    .table-box {
      width: 100%;
      height: 100%;
      line-height: 22px;
      font-family: PingFangSC-Regular;
      font-size: 16px;
      color: #bfbfbf;
      letter-spacing: 0;
      font-weight: 400;
      text-align: center;
      border-radius: 9px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      thead,
      tbody tr {
        display: table;
        width: 100%;
        table-layout: fixed;
      }
      .t-head {
        height: 70px;
        line-height: 70px;
        .h-cell {
          font-size: 20px;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
      }
      .t-body {
        height: calc(100% - 70px);
        overflow-y: scroll;
        .b-line {
          // padding-bottom: 20px;
          line-height: 40px;
        }
        .b-cell {
          font-family: PingFangSC-Regular;
          font-size: 16px;
          opacity: 0.8;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          // color: #ffffff;
        }
      }
    }
    .hash-cell {
      // width: 6rem;
      padding-right: 1.41rem;
    }
    .num-cell {
      padding-left: 1.2rem;
      width: 3rem;
    }
    .file-cell {
      width: 3.66rem;
      > a {
        color: rgb(31, 219, 233);
      }
    }
    .size-cell {
      width: 3.2rem;
    }
  }
  .foot-box {
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    img {
      width: 82px;
      height: 30px;
    }
  }
}
</style>
