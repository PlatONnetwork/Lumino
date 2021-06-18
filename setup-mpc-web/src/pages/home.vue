<template>
  <div class="flame-box">
    <section class="header-box">
      <img class="head-img" src="../assets/images/top.png" alt="" />
      <p class="head-title">FLAME NEDULA LIT</p>
    </section>
    <section class="main-box">
      <div class="display-board">
        <table width="100%" border="0" cellspacing="0" cellpadding="10" class="table-box">
          <thead class="t-head">
            <tr>
              <td v-for="item in titleList" :key="item.label" class="h-cell">{{ item.label }}</td>
            </tr>
          </thead>
          <tbody class="t-body">
            <tr v-for="item in leftTableList" :key="item.walletAddress">
              <td v-for="some in titleList" :key="some.label" class="cell" :class="{ addressCell: some.name === 'address' }">
                <p v-if="some.name === 'download'" class="downCell pointer" @click="downLoadFn(item['address'], leftTotal)">下载</p>
                <p v-else>{{ item[some.name] }}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="display-board">
        <table width="100%" border="0" cellspacing="0" cellpadding="10" class="table-box">
          <thead class="t-head">
            <tr>
              <td v-for="item in titleList" :key="item.label" class="h-cell">{{ item.label }}</td>
            </tr>
          </thead>
          <tbody class="t-body">
            <tr v-for="item in rightTableList" :key="item.walletAddress">
              <td v-for="some in titleList" :key="some.label" class="cell" :class="{ addressCell: some.name === 'address' }">
                <p v-if="some.name === 'download'" class="downCell pointer" @click="downLoadFn(item['address'], rightTotal)">下载</p>
                <p v-else>{{ item[some.name] }}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <section class="footer-box">
      <img class="foot-img" src="../assets/images/bottom.png" alt="" />
      <div class="logo-box">
        <img src="../assets/images/logo.svg" alt="" />
      </div>
    </section>
    <div class="bg-video">
      <video height="100%" width="100%" muted autoplay loop>
        <source src="../assets/mp4/earth.mp4" type="video/mp4" />
      </video>
    </div>
  </div>
</template>
<script>
import api from '../api/index'
import { newWin } from '../utils/utils'
export default {
  name: 'Home',
  data() {
    return {
      leftTotal: 0,
      rightTotal: 0,
      titleList: [
        { label: '钱包地址', name: 'address' },
        { label: '状态', name: 'runningState' },
        { label: '结果下载', name: 'download' }
      ],
      leftTableList: [
        // {
        //   address: '1111111111111111111111111',
        //   runningState: 'true',
        //   download: 'true'
        // },
        // {
        //   address: '2222222222222222222222222222',
        //   runningState: 'true',
        //   download: 'true'
        // },
        // {
        //   address: '1111111111111111111111111',
        //   runningState: 'true',
        //   download: 'true'
        // },
        // {
        //   address: '2222222222222222222222222222',
        //   runningState: 'true',
        //   download: 'true'
        // },
        // {
        //   address: '1111111111111111111111111',
        //   runningState: 'true',
        //   download: 'true'
        // },
        // {
        //   address: '2222222222222222222222222222',
        //   runningState: 'true',
        //   download: 'true'
        // },
        // {
        //   address: '1111111111111111111111111',
        //   runningState: 'true',
        //   download: 'true'
        // },
        // {
        //   address: '2222222222222222222222222222',
        //   runningState: 'true',
        //   download: 'true'
        // },
        // {
        //   address: '1111111111111111111111111',
        //   runningState: 'true',
        //   download: 'true'
        // },
        // {
        //   address: '2222222222222222222222222222',
        //   runningState: 'true',
        //   download: 'true'
        // },
        // {
        //   address: '1111111111111111111111111',
        //   runningState: 'true',
        //   download: 'true'
        // },
        // {
        //   address: '2222222222222222222222222222',
        //   runningState: 'true',
        //   download: 'true'
        // }
      ],
      rightTableList: [
        // {
        //   walletAddress: '1111111111111111111111111',
        //   status: 'true',
        //   download: 'true'
        // },
        // {
        //   walletAddress: '2222222222222222222222222222',
        //   status: 'true',
        //   download: 'true'
        // }
      ]
    }
  },
  mounted() {
    this.initialFn()
  },
  methods: {
    downLoadFn(address, total) {
      newWin('download', address, total)
    },
    initialFn() {
      const reqLeft = api.queryTabledata()
      const reqRight = api.queryTabledata()
      Promise.all([reqLeft, reqRight]).then(res => {
        if (res.length > 0) {
          this.leftTableList = res[0].data.participants
          this.leftTotal = res[0].data.filesCount
          this.rightTableList = res[1].data.participants
          this.rightTotal = res[1].data.filesCount
        }
      })
    }
  }
}
</script>
<style lang="scss" scoped>
.flame-box {
  width: 100%;
  height: 100vh;
  background: #030303;
  color: #ffffff;
  overflow: hidden;
  position: relative;
  z-index: 2;
  .bg-video {
    position: absolute;
    top: 0;
    left: 0;
    z-index: -1;
    width: 100w;
    height: 100vh;
  }
  .header-box {
    display: flex;
    justify-content: center;
    margin-top: 25px;
    position: relative;
    height: 91px;
    .head-img {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
    }
    .head-title {
      font-family: PingFangSC-Semibold;
      font-size: 50px;
      color: rgba(255, 255, 255, 0.9);
      letter-spacing: 0;
      font-weight: 600;
    }
  }
  .main-box {
    min-height: calc(100vh - 232px);
    display: flex;
    justify-content: center;
    gap: 0.28rem;
    .display-board {
      width: 8.46rem;
      height: 4.85rem;
      margin-top: 1.3rem;
      background: url('../assets/images/screen.png') no-repeat;
      background-size: 100% 100%;
      box-sizing: border-box;
      padding: 0.5rem 0.3rem;
      .table-box {
        width: 100%;
        height: auto;
        line-height: 22px;
        font-family: PingFangSC-Regular;
        font-size: 16px;
        color: #bfbfbf;
        letter-spacing: 0;
        font-weight: 400;
        text-align: center;
        overflow-x: hidden;
        .t-head {
          line-height: 0.6rem;
          .h-cell {
            width: 2rem;
          }
        }
        .t-body {
          overflow-y: scroll;
          height: 3.6rem;
          width: calc(100% + 20px);
          .addressCell p {
            max-width: 2rem;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .downCell {
            width: 69px;
            margin: 0 auto;
            // height: 28px;
            border: 1px solid #195556;
            font-size: 14px;
          }
        }
        .cell {
          width: 2rem;
          padding-bottom: 0.2rem;
          text-align: center;
        }
      }
    }
  }
  .footer-box {
    margin-bottom: 25px;
    position: relative;
    height: 91px;
    display: flex;
    justify-content: center;
    .foot-img {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
    }
    .logo-box {
      padding-top: 14px;
    }
  }
}
</style>
