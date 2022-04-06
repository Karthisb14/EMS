const jwt = require('jsonwebtoken')
const user = require('../models/user')

const auth = async(req, res, next) => {
    
    try{
        const token = req.header('Authorization').replace('Bearer ', '')
        // console.log(token)
        const decodetoken = jwt.verify(token, process.env.JSONWEBSECRET)
        const accountinfo = await user.findOne({ _id: decodetoken._id, 'tokens.token': token})

        if(!accountinfo){
            throw new Error()
        }
        
        req.token = token
        req.accountinfo = accountinfo

        next()

    }catch(e){
        res.status(401).send({ error: 'please authenticate'})
    }

}

module.exports = auth