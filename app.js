const express = require('express')
const app = express()

app.get('/', (req, res) => {
  res.send('Hello from Asana Clone!')
})


module.exports = app
