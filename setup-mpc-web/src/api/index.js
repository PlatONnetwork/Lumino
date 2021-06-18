import request from '../utils/request'

const queryTabledata = () => {
  return request({
    method: 'get',
    url: '/api/state'
  })
}
const queryRightTabledata = () => {
  return request({
    method: 'get',
    url: '/right-api/state'
  })
}
const downloadSignatureData = (address, num) => {
  return request({
    method: 'get',
    url: `/api/signature/${address}/${num}`
  })
}
const downloadRightSignatureData = (address, num) => {
  return request({
    method: 'get',
    url: `/right-api/signature/${address}/${num}`
  })
}

const downloadData = (address, num) => {
  return request({
    method: 'get',
    url: `/api/data/${address}/${num}`
  })
}
const downloadRightData = (address, num) => {
  return request({
    method: 'get',
    url: `/right-api/data/${address}/${num}`
  })
}

const downloadList = address => {
  return request({
    method: 'get',
    url: `/api/files/${address}`
  })
}

const downloadRightList = address => {
  return request({
    method: 'get',
    url: `/right-api/files/${address}`
  })
}

const queryHash = (whichSide, address, num) => {
  if (whichSide === 'right') {
    return request({
      method: 'get',
      url: `/right-api/txHash/${address}/${num}`
    })
  } else {
    return request({
      method: 'get',
      url: `/api/txHash/${address}/${num}`
    })
  }
}

export default {
  queryTabledata,
  queryRightTabledata,
  downloadData,
  downloadSignatureData,
  downloadRightSignatureData,
  downloadList,
  downloadRightList,
  downloadRightData,
  queryHash
}
