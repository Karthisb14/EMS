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

router.post('/logout', auth, async (req, res) => {
    // console.log
    try {
        req.accountinfo.tokens = req.accountinfo.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.accountinfo.save()

        res.send('success')
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/leave-management', auth, async (req, res) => {

    const data = new leave({
        ...req.body,
        user_id: req.accountinfo._id
    })
    // console.log(data)

    const querydate = await leave.find({
        fromdate: {
            $lte: data.todate
        },
        todate: {
            $gte: data.fromdate
        }

    })

    // console.log(querydate)
    if (querydate.length == 0) {
        await data.save()
        res.status(200).send(data)
    } else {
        res.status(400).send('Same date not allowed')
    }

})

router.put('/status/:id', auth, async (req, res) => {

    // console.log(req.accountinfo)
    // console.log(req.params.id)
    if (req.accountinfo.role !== 'admin') {
        return res.status(400).send('user authorized')
    }

    const update = await leave.findByIdAndUpdate(req.params.id, { Status: req.body.Update }, { new: true })
    res.status(200).send({ update })
})

router.get('/leaveadmin', auth, async (req, res) => {

    if (req.accountinfo.role === 'admin') {

        const leaveinfo = await leave.aggregate([
            {
                $facet: {
                    "PENDING": [
                        {
                            $match: { Status: 'pending' }
                        }
                    ],
                    "APPROVED": [
                        {
                            $match: { Status: 'approved' }
                        }
                    ],
                    "REJECTED": [
                        {
                            $match: { Status: 'rejected' }
                        }
                    ]
                }

            },
            
        ])
        var arr=[]
        arr.push(leaveinfo[0].PENDING,leaveinfo[0].APPROVED,leaveinfo[0].REJECTED)
        res.send(arr)
    }

    // if(req.query.status){
    //     const finddata = await leave.find({Status: req.query.status})
    //     return res.send({finddata})
    // }else{
    //     const findall = await leave.find({})
    //     return res.send({findall})

    // }
})

router.get('/leave-history', auth, async (req, res) => {

    // console.log(req.query)

    let querymatch = { user_id: req.accountinfo._id }
    const query = req.query
    // console.log(querymatch)
    // console.log(query)

    if (query.type) {
        querymatch.leavetype = query.type
    }

    if (query.status) {
        querymatch.Status = query.status
    }


    // console.log(querymatch)

    const alldata = await leave.aggregate([
        {
            $match: querymatch
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
                Status: 1
            }
        },

    ])
    //  console.log(alldata)
    res.status(200).send(alldata)

})


router.get('/leavebalance', auth, async (req, res) => {
    const data = await leave.aggregate([
        {
            $facet: {
                "Total": [
                    {
                        $match: { user_id: req.accountinfo._id, leavetype: 'WFH' },

                    },
                    {
                        $count: "Total"
                    }
                ],
                "CL": [
                    {
                        $match: { user_id: req.accountinfo._id, leavetype: 'CL' }
                    },
                    {
                        $count: "CL"
                    }
                ],
                "LOP": [
                    {
                        $match: { user_id: req.accountinfo._id, leavetype: 'LOP' }
                    },
                    {
                        $count: "LOP"
                    }
                ],
                "EL": [
                    {
                        $match: { user_id: req.accountinfo._id, leavetype: 'EL' }
                    },
                    {
                        $count: "EL"
                    }
                ]
            },
        },
        {
            $project: {
                "TotalWFH": {
                    $arrayElemAt: ["$Total.Total", 0]
                },
                "TotalLOP": {
                    $ifNull: [{ $arrayElemAt: ['$LOP.LOP', 0] }, 0]
                },
                "Total_CL": {
                    $subtract: [12, { $arrayElemAt: ["$CL.CL", 0] }]
                },
                "Total_EL": {
                    $subtract: [20, { $arrayElemAt: ["$EL.EL", 0] }]
                }
            }

        },
        {
            $project: {
                TotalWFH: 1,
                TotalLOP: 1,
                Total_CL: 1,
                // {
                //     $ifNull: ["$Total_CL", 12]
                // },
                Total_EL: 1
            }
        }

    ])
    res.send(data)
})

module.exports = router