const mongoose = require('mongoose')

const leaveSchema = new mongoose.Schema({
    leavetype:{
        type: String,
        required: true,
        enum: ['CL', 'EL', 'LOP', 'WFH']
    },
    fromdate:{
        type: Date,
        required: true,
    },
    todate:{
        type: Date,
        required: true
    },
    Reasonforapply:{
        type: String,
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'userdetails'
    },
    Status: {
        type: String,
        required: true,
        default: 'pending'
    },
    
},
{
    timestamps: true
})

leaveSchema.methods.toJSON = function() {
    const leavedata = this
    const leaveobject = leavedata.toObject()

    delete leaveobject.Reasonforapply
    delete leaveobject.__v
    delete leaveobject._id
    
    return leaveobject
}
const leave = mongoose.model('leave-management', leaveSchema)

module.exports = leave