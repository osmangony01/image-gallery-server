
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("server is running ...");
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l6kpz6n.mongodb.net/taskManagement`;

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
        client.connect();
        // Send a ping to confirm a successful connection

        const imageCollection = client.db("taskManagement").collection("imageGallery");

        // upload images route
        app.post('/upload-images',  async (req, res) => {

            //console.log(req.files)
            const {imgData} = req.body;
            //const files = req.body;
            //console.log(imgData)
            const images = imgData.map((file) => {
                const ob = { "image": file };
                return ob;
            });
            //console.log(images)

            try {
                const result = await imageCollection.insertMany(images);
                res.status(201).json({
                    ok: true,
                    message: "Images are created"
                })
            }
            catch (error) {
                res.status(500).json({
                    ok: false,
                    message: "Failed to insert image"
                })
            }
        });

        // get images route for fetch data from mongodb
        app.get('/images', async (req, res) => {
            try {
                const data = await imageCollection.find().toArray();;
                res.status(200).send(data);
            }
            catch (error) {
                res.status(500).send(error.message)
            }
        });

        // delete images route
        app.delete('/delete-images', async (req, res) => {

            const selectedImages = req.body;
            //console.log(selectedImages);

            // extract ids for deleting
            const extractedIds = selectedImages.map(obj => obj._id);

            // Create an array of ObjectIds from the _id values to be deleted
            const ObjectIdsToDelete = extractedIds.map(_id => new ObjectId(_id));
            //console.log(ObjectIdsToDelete);

            try {
                // Delete the documents with matching _id values
                const result = await imageCollection.deleteMany({ _id: { $in: ObjectIdsToDelete } });
                res.status(201).json({
                    ok: true,
                    deletedCount: result.deletedCount,
                    message: 'Deleted image successfully',
                })
            }
            catch (error) {
                res.status(500).json({
                    ok: false,
                    message: 'Failed to delete image'
                })
            }
        });

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }
    finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.listen(PORT, () => {
    console.log('Image gallery server is running on PORT: ', PORT);
})