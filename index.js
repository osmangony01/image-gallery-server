
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// image upload code

const UPLOAD_FOLDER = path.join(__dirname, 'upload');

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, UPLOAD_FOLDER);
    },

    filename: function (req, file, cb) {
        const fileExt = path.extname(file.originalname);
        const filename = file.originalname.replace(fileExt, "").toLocaleLowerCase().split(" ").join("-") + "-" + Date.now();
        cb(null, filename + fileExt);
    }
})

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        console.log(file)
        cb(null, true)
    }
});




async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        client.connect();
        // Send a ping to confirm a successful connection

        const imageCollection = client.db("taskManagement").collection("imageGallery");




        // upload images route
        app.post('/upload-images', upload.array('files', 10), async (req, res) => {

            console.log('hitted')
            console.log(req.files)
            const files = req.files;
            const images = files.map((file) => {
                const ob = { "image": file.filename };
                return ob;
            });

            console.log(images)
            //console.log(req.body)

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