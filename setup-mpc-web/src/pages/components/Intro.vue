<template>
  <div class="wrapper">
    <div class="left-box">
      <div class="line-one tar">
        <div class="title">
          Lumino: A Secure Multi-Party Computation Ceremony to Light Up the
          Evolving Privacy-Preserving AI Network
        </div>
        <div class="content">
          <p>
            Lumino is a trustless multi-party ceremony of generating “common
            reference strings” (CRS) for zero-knowledge proof systems. This is a
            prior and necessary step to deploy privacy-preserving applications
            in decentralized ecosystems.
          </p>
          <p>
            Lumino aims to conduct an infrastructure for privacy-preserving
            applications based on zk-SNARKs. As a global community event, Lumino
            calls upon distributed participants all over the world to join. The
            resulting parameters are NOT merely targeted for Alaya or PlatON,
            but also could be served as public resources for ANY decentralized
            cryptographic applications built on zero-knowledge proof techniques.
          </p>
          <p>
            Lumino now focuses on PLONK, which is an efficient zk-SNARKs
            algorithm and commonly used in the blockchain community. One
            attractive property of PLONK is that, this setup procedure only
            needs to perform once for many applications. In constract to
            existing ceremonies, Lumino will perform an MPC protocol on two
            curves, including BN254 and BLS12-381.
          </p>
        </div>
      </div>
      <div class="line-two">
        <div class="line-two-left tar">
          <div class="title">How Long Do I Need to Run the Computation?</div>
          <div class="content">
            <p>
              For each participant, the computation usually takes 1 to 10 hours
              (depending on your machine and bandwidth) to run our client
              software.
            </p>
            <p>
              You could wait until your pre-determined position and complete the
              computation. Alternatively, you can join at any time during the
              ceremony, and be scheduled instantly if no other active client is
              prior over you.
            </p>
            <p>
              The only restriction is a 15-hour time window, which will be setup
              for each committed participant, to encourage you to finish your
              piece of work in time.
            </p>
          </div>
        </div>
        <div class="line-two-right tar">
          <div class="title">The Security of the Trustless Coordination</div>
          <div class="content">
            <p>
              The security of the ceremony relies on the honest participants. In
              fact, if there is only ONE participant behaves honestly, the whole
              ceremony is succeeded and the generated CRS can be securely
              adopted by global cryptocurrency communities. That is also the
              reason for which we hold a two-month ceremony without any
              permission, and encourage as many people as possible to join this
              activity.
            </p>
            <p>
              From the integrity respective, we will adopt a verify-and-compute
              paradigm, for each participant to run the client software. More
              technical details will come soon.
            </p>
          </div>
        </div>
      </div>
    </div>
    <div class="right-box tar">
      <div class="title">When and How to Participate This Event?</div>
      <div class="content">
        <p>Lumino will start in June, we will release the details soon.</p>
        <p>
          Lumino will be divided into two computing groups, each group will run
          the code for one curve. You may choose to be one of the two computing
          groups for different underlying cryptographic settings, or you can
          participate in both computing groups as you want.
        </p>
        <p>
          The procedure will perform in sequence. Once the ceremony starts, you
          can simply run the open-sourced client software at your turn and
          complete the computation within a few hours. As an individual
          participant, you could actively join the ceremon
        </p>
      </div>
      <div class="content-img">
        <img src="../../assets/images/content.svg" alt="" />
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'Intro',
  data() {
    return {
      hash: '',
      preUrl: ''
    }
  }
}
</script>
<style lang="scss" scoped>
.wrapper {
  // min-height: calc(100vh - 232px);
  display: flex;
  width: calc(100vw - 2rem);
  height: 5.6rem;
  background: url("../../assets/images/intro-bg.png") no-repeat;
  background-size: 100% 100%;
  margin: 0 auto;
  margin-top: 0.32rem;
  overflow-y: scroll;
  @media screen and (max-width: 1367px) {
    height: 4.8rem;
  }
  .right-box,
  .left-box {
    .title {
      line-height: 0.28rem;
      font-family: PingFangSC-Semibold;
      font-size: 0.2rem;
      color: rgba(255, 255, 255, 0.9);
      letter-spacing: 0;
      font-weight: 600;
    }
    .content > p {
      font-family: PingFangSC-Regular;
      font-size: 0.12rem;
      color: rgba(255, 255, 255, 0.61);
      letter-spacing: 0;
      line-height: 0.2rem;
      font-weight: 400;
      margin-top: 0.16rem;
    }
  }
  .right-box {
    width: 5.48rem;
    height: 3.6rem;
    margin: 0.4rem;
    justify-content: start;
    .content-img {
      width: 4.45rem;
      margin-top: 0.16rem;
      img {
        width: 100%;
      }
    }
  }
  .left-box {
    flex: 1;
    padding: 0.4rem 0rem 0.4rem 0.4rem;
    display: block;
    justify-content: start;
    .line-one {
      position: relative;
    }

    .line-two {
      display: flex;
      margin-top: 0.48rem;
      padding-bottom: 0.3rem;
      .line-two-left {
        flex: 1;
        padding-right: 0.2rem;
      }
      .line-two-right {
        flex: 1;
        margin-left: 0.2rem;
      }
    }
  }
  .tar {
    position: relative;
    &::before {
      content: "";
      width: 1px;
      height: 90%;
      position: absolute;
      left: -0.126rem;
      top: 0.14rem;

      background: linear-gradient(
        180deg,
        #72dedd 0%,
        rgba(62, 186, 185, 0) 100%
      );
      z-index: 0;
    }
    &::after {
      content: "";
      width: 0.09rem;
      height: 0.09rem;
      position: absolute;
      top: 0.14rem;
      left: -0.12rem;
      background: #000;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      border: 1px solid #3ebab9;
      z-index: 1000;
    }
  }
}
</style>
