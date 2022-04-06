const mongoose = require('mongoose')


const connectDB = async() => {
    const conn = await mongoose.connect(process.env.MONGO_DB, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })

    console.log('connected successfully!')
}

module.exports = connectDB