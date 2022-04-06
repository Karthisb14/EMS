const express = require('express')
const connectDB = require('./db/database')
const userrouter = require('./Router/user-route')
const dotenv = require('dotenv')

dotenv.config({path: './Config/dev.env'})

const app = express()
connectDB()
const port = process.env.PORT || 3000

app.use(express.json())
app.use(userrouter)


app.listen(port, () => {
    console.log('Server is up on port ' + port)
})
