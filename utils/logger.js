const info = (...params) => {
  console.log(...params)
}

const error = (...params) => {
  console.error(...params)
}

const test = () => {
  console.log('program starts runnung')
}

module.exports = {
  info, error, test
}