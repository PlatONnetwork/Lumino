<template>
  <div class="flame-box">
    <section class="header-box">
      <img class="head-img" src="../assets/images/top.png" alt="" />
      <p class="head-title">LUMINO</p>
      <p class="sub-title">Light up the Evolving Road</p>
    </section>
    <div
      class="left-btn pointer"
      :class="{ active: showIntroduction }"
      @click="showIntroduction = true"
    >
      <p>Introduction</p>
    </div>
    <div
      class="right-btn pointer"
      :class="{ active: !showIntroduction }"
      @click="showIntroduction = false"
    >
      <p>Details</p>
    </div>
    <section v-if="showIntroduction" class="main-box">
      <Intro />
    </section>
    <section v-else class="main-box">
      <div class="display-board">
        <p class="display-title">
          <!-- <span class="title-status">{{ BNStatus }}</span> -->
          <img
            v-if="
              BNStatus === 'PRESELECTION' ||
              BNStatus === 'SELECTED' ||
              BNStatus === 'RUNNING'
            "
            src="../assets/images/running.svg"
            alt=""
          />
          <img
            v-if="BNStatus === 'COMPLETE'"
            src="../assets/images/complete.svg"
            alt=""
          />
          <span class="title">BN256</span>
        </p>
        <table
          width="100%"
          border="0"
          cellspacing="0"
          cellpadding="10"
          class="table-box"
        >
          <thead class="t-head">
            <tr>
              <td
                v-for="item in titleList"
                :key="item.label"
                class="h-cell"
                :class="{ addressHeadCell: item.name === 'address' }"
              >
                {{ item.label }}
              </td>
            </tr>
          </thead>
          <tbody class="t-body">
            <tr v-for="item in leftTableList" :key="item.walletAddress">
              <td
                v-for="some in titleList"
                :key="some.label"
                class="cell"
                :class="{ addressCell: some.name === 'address' }"
              >
                <p
                  v-if="some.name === 'download'"
                  class="downCell"
                  :class="{ pointer: item.state === 'COMPLETE' }"
                >
                  <span
                    v-if="item.state === 'COMPLETE'"
                    class="useable"
                    @click="downLoadFn(item['address'], leftTotal, 'left')"
                  >
                    DOWNLOAD
                  </span>
                  <span v-else>UNAVAILABLE</span>
                </p>
                <p v-else-if="some.name === 'address'" v-tooltip="item.address">
                  {{ item.address }}
                </p>
                <p v-else class="status-cell">
                  {{ mapStatus(item[some.name]) }}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="display-board">
        <p class="display-title">
          <img
            v-if="
              BNStatus === 'PRESELECTION' ||
              BNStatus === 'SELECTED' ||
              BNStatus === 'RUNNING'
            "
            src="../assets/images/running.svg"
            alt=""
          />
          <img
            v-if="BNStatus === 'COMPLETE'"
            src="../assets/images/complete.svg"
            alt=""
          />
          <span class="title">BLS12-381</span>
        </p>
        <table
          width="100%"
          border="0"
          cellspacing="0"
          cellpadding="10"
          class="table-box"
        >
          <thead class="t-head">
            <tr>
              <td
                v-for="item in titleList"
                :key="item.label"
                class="h-cell"
                :class="{ addressHeadCell: item.name === 'address' }"
              >
                {{ item.label }}
              </td>
            </tr>
          </thead>
          <tbody class="t-body">
            <tr v-for="item in rightTableList" :key="item.walletAddress">
              <td
                v-for="some in titleList"
                :key="some.label"
                class="cell"
                :class="{ addressCell: some.name === 'address' }"
              >
                <p
                  v-if="some.name === 'download'"
                  class="downCell"
                  :class="{ pointer: item.state === 'COMPLETE' }"
                >
                  <span
                    v-if="item.state === 'COMPLETE'"
                    class="useable"
                    @click="downLoadFn(item['address'], rightTotal, 'right')"
                  >
                    DOWNLOAD
                  </span>
                  <span v-else>UNAVAILABLE</span>
                </p>
                <p v-else-if="some.name === 'address'" v-tooltip="item.address">
                  {{ item.address }}
                </p>
                <p v-else class="status-cell">
                  {{ mapStatus(item[some.name]) }}
                </p>
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
      <p class="copyright">
        Copyright ©{{ curYear }} LatticeX Foundation. All rights reserved
      </p>
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
import Intro from './components/Intro'
export default {
  name: 'Home',
  components: {
    Intro
  },
  data() {
    return {
      showIntroduction: true,
      searchValue: 'hello world',
      curYear: '',
      BNStatus: '',
      BLSStatus: '',
      timer: '',
      interval: 1000 * 60,
      leftTotal: 0,
      rightTotal: 0,
      titleList: [
        { label: 'Address', name: 'address' },
        { label: 'Status', name: 'state' },
        { label: 'Transcripts', name: 'download' }
      ],
      leftTableList: [],
      rightTableList: []
    }
  },
  beforeDestroy() {
    window.clearTimeout(this.timer)
  },
  mounted() {
    this.initialFn()
    this.queryYear()
  },
  methods: {
    changeValue(e) {
      console.log(e.target.value)
      const s = e.target.value
      const content = document.getElementById('main-box').innerHTML
      var reg = new RegExp('(' + s + ')', 'g')
      var str = content
      var newstr = str.replace(reg, '<font color=#FF6633>$1</font>')
      document.getElementById('main-box').innerHTML = newstr
    },
    queryYear() {
      this.curYear = new Date().getFullYear()
    },
    downLoadFn(address, total, whichSide) {
      newWin('download', address, total, whichSide)
    },
    mapStatus(status) {
      if (status === 'INVALIDATED') {
        console.log(status)
        return 'FAILED'
      }
      if (status === 'COMPLETE') {
        return 'COMPLETED'
      }
      return status
    },
    async getRightFn() {
      const res = await api.queryRightTabledata()
      if (res.data) {
        // 给出新接口后拿到
        this.rightTableList = res.data.participants
        this.rightTotal = res.data.filesCount
        this.BLSStatus = res.data.ceremonyState
      }
    },
    async getLeftFn() {
      const res = await api.queryTabledata()
      if (res.data) {
        this.leftTableList = res.data.participants
        this.leftTotal = res.data.filesCount
        this.BNStatus = res.data.ceremonyState
      }
    },
    async initialFn() {
      await this.getLeftFn()
      await this.getRightFn()
      if (this.timer) clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        this.initialFn()
      }, this.interval)
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
  .left-btn {
    left: 1.58rem;
    background: url("../assets/images/left-dark.png");
    background-size: 100% 100%;
    @media screen and (max-width: 1367px) {
      left: 1rem;
    }
    &.active {
      background: url("../assets/images/left-light.png");
      background-size: 100% 100%;
      cursor: unset;
      > p {
        color: #fff;
      }
    }
  }
  .left-btn,
  .right-btn {
    position: absolute;
    top: 0.94rem;
    width: 2rem;
    height: 0.62rem;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    @media screen and (max-width: 1367px) {
      top: 1.2rem;
    }
    p {
      height: 0.28rem;
      line-height: 0.28rem;
      font-family: PingFangSC-Semibold;
      font-size: 0.2rem;
      color: #1fdbe9;
      letter-spacing: 0;
      font-weight: 600;
    }
  }
  .right-btn {
    right: 1.58rem;
    background: url("../assets/images/right-dark.png");
    background-size: 100% 100%;
    @media screen and (max-width: 1367px) {
      right: 1rem;
    }
    &.active {
      background: url("../assets/images/right-light.png");
      background-size: 100% 100%;
      cursor: unset;
      > p {
        color: #fff;
      }
    }
  }
  .bg-video {
    position: absolute;
    top: 0;
    left: 0;
    z-index: -1;
    width: 100vw;
    height: 100vh;
  }
  .header-box {
    display: flex;
    justify-content: start;
    align-items: center;
    margin-top: 0.25rem;
    position: relative;
    flex-direction: column;
    height: 0.91rem;
    .head-img {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
    }
    .head-title {
      font-family: PingFangSC-Semibold;
      font-size: 0.5rem;
      color: rgba(255, 255, 255, 0.9);
      letter-spacing: 0;
      font-weight: 600;
      line-height: 0.7rem;
      margin-top: -0.2rem;
    }
    .sub-title {
      height: 0.25rem;
      font-family: PingFangSC-Semibold;
      font-size: 0.18rem;
      color: #ffffff;
      letter-spacing: 0;
      font-weight: 600;
    }
  }
  .main-box {
    min-height: calc(100vh - 2.32rem);
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.28rem;
    .display-board {
      width: 8.46rem;
      height: 4.85rem;
      background: url("../assets/images/screen.png") no-repeat;
      background-size: 100% 100%;
      box-sizing: border-box;
      padding: 0.5rem 0.3rem;
      position: relative;
      margin-top: 0.32rem;
      .display-title {
        position: absolute;
        top: 0.12rem;
        left: 50%;
        transform: translateX(-50%);
        font-size: 0.2rem;
        .title {
          vertical-align: middle;
          padding-left: 0.1rem;
          font-size: 0.28rem;
        }
        img {
          vertical-align: middle;
        }
      }
      .table-box {
        width: 100%;
        height: auto;
        line-height: 0.22rem;
        font-family: PingFangSC-Regular;
        font-size: 0.16rem;
        color: #bfbfbf;
        letter-spacing: 0;
        font-weight: 400;
        text-align: center;
        overflow-x: hidden;
        tbody tr,
        thead tr {
          width: 100%;
        }
        .t-head {
          line-height: 0.6rem;
          .h-cell {
            width: 2.6rem;
            font-size: 0.2rem;
          }
          .h-cell.addressHeadCell {
            width: 3rem;
            overflow: hidden;
            text-overflow: ellipsis;
            display: table;
          }
        }
        .t-body {
          overflow-y: scroll;
          height: 3.6rem;
          // width: calc(100% + 0.2rem);
          .addressCell p {
            width: 3rem;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 0.16rem;
          }
          .cell {
            width: 2.6rem;
            padding-bottom: 0.2rem;
            text-align: center;
          }
          .downCell {
            width: 1.2rem;
            display: inline-block;
            margin: 0 auto;
            font-size: 0.14rem;
            border-radius: 2px;
            span {
              display: inline-block;
            }
            .useable {
              border: 1px solid #195556;
              padding: 0 0.1rem;
              color: rgb(31, 219, 233);
            }
          }
          .status-cell {
            font-size: 0.14rem;
          }
        }
      }
    }
  }
  .footer-box {
    margin-bottom: 0.25rem;
    position: relative;
    height: 0.91rem;
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    .foot-img {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
    }
    .logo-box {
      padding-top: 0.27rem;
      img {
        width: 0.6rem;
      }
    }
    p.copyright {
      font-size: 0.12rem;
      color: #777;
      margin-top: 0.1rem;
    }
  }
}
</style>
