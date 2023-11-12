const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
require('dotenv').config()
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000


app.use(cors({
    origin: ['http://localhost:5173', 'https://costay-d3e93.web.app'],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.opj08k2.mongodb.net/?retryWrites=true&w=majority`;




// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const logger = (req, res, next) => {
    console.log('log: info', req.method, req.url);
    next();
}



// verify

const verifyToken = (req, res, next) => {
    const { token } = req.cookies


    //if client does not send the token
    if (!token) {
        return res.status(401).send({ message: 'You are not authorized' })
    }

    jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'You are not authorized' })
        }

        console.log(req.user);
        next()

    })

}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        //collection
        const roomsCollection = client.db('costay').collection('rooms')
        const bookingsCollection = client.db('costay').collection('bookings')
        const reviewCollection = client.db('costay').collection('review')



        //apis
        app.get('/rooms', async (req, res) => {

            let sortObj = {}
            const sortField = req.query.sortField
            const sortOrder = req.query.sortOrder


            if (sortField && sortOrder) {
                sortObj[sortField] = sortOrder;
                // means pushing {price: 'desc/asc'} in sortObj
            }

            const result = await roomsCollection.find().sort(sortObj).toArray()
            res.send(result)
        })

        app.get('/rooms/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await roomsCollection.findOne(query)
            res.send(result)
        })

        app.get('/bookings', async (req, res) => {
            
            let query = {}
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await bookingsCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/review', async (req, res) => {
            const result = await reviewCollection.find().toArray()
            res.send(result)
        })

        app.post('/bookings', async (req, res) => {
            const bookings = req.body

            const result = await bookingsCollection.insertOne(bookings)


            res.send(result)
        })
        app.post('/review', async (req, res) => {
            const review = req.body

            const result = await reviewCollection.insertOne(review)

            console.log(review);
            res.send(result)
        })

        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await bookingsCollection.deleteOne(query)
            res.send(result)
        })

        app.put('/rooms/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updated = {
                $inc: {
                    available_seats: - 1
                }
            }

            const result = await roomsCollection.updateOne(filter, updated, options)
            res.send(result)
        })
        app.put('/bookings/:id', async (req, res) => {
            const date = req.body
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updated = {
                $set: {
                    bookingDate: date.inputValue,
                }
            }

            const result = await bookingsCollection.updateOne(filter, updated, options)
            res.send(result)
        })

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, { expiresIn: '1h' })


            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                })
                .send({ status: true })

        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out', user);

            res
                .clearCookie('token', {
                    maxAge: 0,
                    secure: process.env.NODE_ENV === 'production' ? true : false,
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                })
                .send({ status: true })
        })


    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})