import request from '../utils/request'

const queryTabledata = () => {
  return request({
    method: 'get',
    url: '/api/state'
  })
}

const downloadSignatureData = (address, num) => {
  return request({
    method: 'get',
    url: `/api/signature/${address}/${num}`
  })
}

const downloadData = (address, num) => {
  return request({
    method: 'get',
    url: `/api/data/${address}/${num}`
  })
}

const downloadList = address => {
  return request({
    method: 'get',
    url: `/api/files/${address}`
  })
}

export default {
  queryTabledata,
  downloadData,
  downloadSignatureData,
  downloadList
}
