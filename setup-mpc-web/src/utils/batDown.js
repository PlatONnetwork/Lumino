const _mountDom = url => {
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  iframe.style.height = 0
  iframe.src = url
  document.body.appendChild(iframe)
  setTimeout(() => {
    iframe.remove()
  }, 1000 * 5)
}
const batDownFn = urlList => {
  const jsonUrlList = JSON.parse(urlList)
  for (let index = 0; index < jsonUrlList.length; index++) {
    _mountDom(jsonUrlList[index])
  }
}

const dataDownFn = (data, index, type) => {
  const url = window.URL.createObjectURL(new Blob([data]), { type: 'application/octet-stream' })
  const link = document.createElement('a')
  link.style.display = 'none'
  link.href = url
  link.setAttribute('download', `file_${index}.${type}`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
export { batDownFn, dataDownFn }
