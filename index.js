const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
require('dotenv').config()
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000


app.use(express.json())
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}))

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.opj08k2.mongodb.net/?retryWrites=true&w=majority`;




// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

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
            console.log(result);
            res.send(result)
        })
        app.get('/bookings', async (req, res) => {
            const result = await bookingsCollection.find().toArray()
            console.log(result);
            res.send(result)
        })

        app.post('/bookings', async (req, res) => {
            const bookings = req.body

            const result = await bookingsCollection.insertOne(bookings)

            console.log(bookings);
            res.send(result)
        })

        app.delete('/bookings/:id', async(req, res)=>{
            const id = req.params.id
            const query = {_id: new ObjectId(id)}
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
        app.patch('/bookings/:id', async (req, res) => {
            const date = req.body
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updated = {
                $set: {
                    date: date.inputValue
                }
            }
            
            const result = await bookingsCollection.updateOne(filter, updated, options)
            res.send(result)
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