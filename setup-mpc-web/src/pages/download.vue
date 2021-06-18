<template>
  <div class="download-box">
    <img class="bg" src="../assets/images/2.bg.png" alt="bg" />
    <div class="tabs-box">
      <div class="left">
        <span class="tab pointer" :class="curTab === 'data' ? 'active' : ''" @click="curTab = 'data'">Data</span>
        <span class="tab pointer" :class="curTab === 'signatrue' ? 'active' : ''" @click="curTab = 'signatrue'">Signatrue</span>
      </div>

      <div class="right">
        <span class="s-tab total pointer">总计 : {{ total }}</span>
        <span class="s-tab address pointer">地址 : {{ address }}</span>
        <span class="s-tab backFont pointer" @click="backFn">返回</span>
      </div>
    </div>
    <div class="table-wraper">
      <table v-if="curTab === 'data'" width="100%" border="0" cellspacing="0" cellpadding="10" class="table-box">
        <thead class="t-head">
          <tr>
            <td v-for="title in titleList" :key="title.index" class="h-cell">{{ title.label }}</td>
          </tr>
        </thead>
        <tbody class="t-body">
          <tr v-for="(item, index) in dataAry" :key="index" class="b-line">
            <td class="b-cell">{{ item.num }}</td>
            <td class="b-cell">
              <a href="javascript:void(0);" @click="downDataFn(address, item.num)">{{ item.name }}</a>
            </td>
            <td class="b-cell">{{ item.size | sizeFilter }}</td>
          </tr>
        </tbody>
      </table>
      <table v-else width="100%" border="0" cellspacing="0" cellpadding="10" class="table-box">
        <thead class="t-head">
          <tr>
            <td v-for="title in titleList" :key="title.index" class="h-cell">{{ title.label }}</td>
          </tr>
        </thead>
        <tbody class="t-body">
          <tr v-for="(item, index) in signatrueAry" :key="index" class="b-line">
            <td class="b-cell">{{ item.num }}</td>
            <td class="b-cell">
              <a href="javascript:void(0);" @click="downSignFn(address, item.num)">{{ item.name }}</a>
            </td>
            <td class="b-cell">{{ item.size | sizeFilter }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script>
import api from '../api/index'
import { sizeToStr } from '../utils/utils'
import { dataDownFn } from '../utils/batDown'
export default {
  filters: {
    sizeFilter: function (size) {
      if (!size) return '0.00k'
      return sizeToStr(size)
    }
  },
  data() {
    return {
      curTab: 'data',
      dataAry: [],
      signatrueAry: [],
      titleList: [
        {
          index: 0,
          name: 'index',
          label: '序号'
        },
        {
          index: 1,
          name: 'file',
          label: '文件名称(点击下载)'
        },
        { index: 2, name: 'size', label: '文件大小' }
      ]
    }
  },

  computed: {
    address() {
      return this.$route.query.address
    },
    total() {
      return this.$route.query.total
    }
  },
  mounted() {
    this.initialFn()
  },
  methods: {
    backFn() {
      this.$router.push({
        name: 'home'
      })
    },
    downDataFn(address, index) {
      api.downloadData(address, index).then(res => {
        const { data } = res
        dataDownFn(data, index, 'data')
      })
    },
    downSignFn(address, index) {
      api.downloadSignatureData(address, index).then(res => {
        const { data } = res
        dataDownFn(data, index, 'signature')
      })
    },
    initialFn() {
      api.downloadList(this.address).then(res => {
        const originalData = res.data
        originalData.forEach(item => {
          if (item.name.split('.')[1] === 'dat') {
            this.dataAry.push(item)
          } else if (item.name.split('.')[1] === 'sig') {
            this.signatrueAry.push(item)
          }
        })
      })
    }
  }
}
</script>
<style lang="scss" scoped>
.download-box {
  background-image: url('../assets/images/2.bg.png') no-repeat;
  background-size: 100% 100%;
  box-sizing: border-box;
  width: 100%;
  height: 100vh;
  background: #030303;
  color: #ffffff;
  position: relative;
  padding: 50px 100px;
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
    height: 33px;
    margin-bottom: 26px;
    display: flex;
    justify-content: space-between;
    .tab {
      width: 54px;
      height: 33px;
      font-family: PingFangSC-Medium;
      font-size: 24px;
      color: #ffffff;
      letter-spacing: 0;
      font-weight: 500;
    }
    .s-tab {
      font-family: PingFangSC-Medium;
      font-size: 16px;
      color: #ffffff;
      letter-spacing: 0;
      font-weight: 500;
      padding-left: 40px;
      &:hover {
        color: rgb(31, 219, 233);
      }
    }
    & .active {
      color: rgb(31, 219, 233);
    }
    & .left span:nth-child(1) {
      padding-right: 70px;
    }
    .left,
    .right {
      display: flex;
      align-items: center;
    }
  }
  .table-wraper {
    width: 100%;
    height: calc(100vh - 160px);
    border: 1px solid #ffffff;
    border-radius: 9px;
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
      overflow-x: hidden;
      .t-head {
        height: 70px;
        line-height: 70px;
        .h-cell {
          font-size: 20px;
        }
      }
      .t-body {
        height: calc(100% - 90px);
        width: calc(100% + 20px);
        overflow-y: scroll;
        .b-line {
          margin-bottom: 20px;
        }
        .b-cell {
          font-family: PingFangSC-Regular;
          font-size: 16px;
          opacity: 0.8;
          // color: #ffffff;
        }
      }
    }
  }
}
</style>
