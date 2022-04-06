const mongoose = require('mongoose')
const validator = require('validator')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    role: {
        type: String,
        default: 'User',
        enum: ['admin', 'User']
        
    },
}, {
    timestamps: true
})

userSchema.methods.generateAuthToken = async function() {
    const authtoken = this
    // console.log(authtoken)
    
    const Gentoken = jwt.sign({ _id: authtoken._id.toString() }, process.env.JSONWEBSECRET)
    // console.log(Gentoken)

    authtoken.tokens = authtoken.tokens.concat({token: Gentoken})
    await authtoken.save()

    return Gentoken
}

userSchema.statics.findByCredentials = async(email, password) => {
   
    const emailinfo = await user.findOne({email: email})

    if(!emailinfo){
        throw new Error('Unable to login')
    }

    const ismatch = await bcrypt.compareSync(password, emailinfo.password)

    if(!ismatch){
        throw new Error('Unable to login')
    }
   
    return emailinfo
}

userSchema.pre('save', async function(next){
    const userpassword = this

    if(userpassword.isModified('password')){
        userpassword.password = await bcrypt.hash(userpassword.password, 8)
    }
    
    next()
})


const user = mongoose.model('userdetails', userSchema)

module.exports = user