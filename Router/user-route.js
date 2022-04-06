const express = require('express')
const user = require('../models/user')
const leave = require('../models/leave')
const auth = require('../Middleware/auth')

const router = new express.Router()

router.post('/signup', async (req, res) => {
    const userregister = new user(req.body)
    // console.log(userregister)

    try {
        await userregister.save()
        const token = await userregister.generateAuthToken()
        // console.log(token)
        res.status(201).send({ userregister, token })
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/login', async (req, res) => {
    try {
        const userinfo = await user.findByCredentials(req.body.email, req.body.password)
        // console.log(userinfo)
        const token = await userinfo.generateAuthToken()
        res.send({ userinfo, token })
    } catch (e) {
        res.status(400).send()
    }
})

router.post('/leave-management', auth, async (req, res) => {

    const data = new leave({
        ...req.body,
        user_id: req.accountinfo._id
    })
    // console.log(data)
    await data.save()
    res.status(200).send(data)
})

router.get('/leave-history', auth, async (req, res) => {


    const userinfo = req.accountinfo
    // console.log(userinfo)

    const alldata = await leave.aggregate([
        {
            $match: { user_id: userinfo._id }

        },
        {
            $addFields: {
                DayDuration: {
                    $round: {
                        $divide: [
                            {
                                $subtract: [
                                    "$todate",
                                    "$fromdate"
                                ]
                            },
                            86400000
                        ]
                    }
                }
            }
        },
        {
            $project: {
                leavetype: 1, user_id: 1, _id: 0,
                from_date: { $dateToString: { format: "%Y-%m-%d", date: "$fromdate" } },
                To_date: { $dateToString: { format: "%Y-%m-%d", date: "$todate" } },
                "Duration(Days)": {
                    $add: ["$DayDuration", 1]
                },
                Status:"Approved"
            }
        },

    ])
    res.send(alldata)

})

router.get('/leave', async (req, res) => {
    const data = await leave.find({ leavetype: req.query.leavetype })

    return res.send(data)
})

module.exports = router