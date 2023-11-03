
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

// get image route for image read
app.get('/image', (req, res) => {

    const { img } = req.query;
    const filename = path.join(__dirname, 'upload', img);

    try {
        if (fs.existsSync(filename)) {
            res.status(200).sendFile(filename);
        } else {
            res.status(404).send('File not found');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Server error');
    }
})

// handle to delete file
const deleteFiles = (files) => {
    
    files.forEach((file) => {
        const filePath = UPLOAD_FOLDER + "/" + file;
        console.log(filePath);
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(`Error deleting ${filePath}:`, err);
            } else {
                console.log(`${filePath} deleted successfully`);
            }
        });
    });
}

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
            console.log(selectedImages);

            // extract id and images as array to delete
            const extractedImages = selectedImages.map(obj => obj.image);
            const extractedIds = selectedImages.map(obj => obj._id);

            // Create an array of ObjectIds from the _id values to be deleted
            const ObjectIdsToDelete = extractedIds.map(_id => new ObjectId(_id));

            console.log(ObjectIdsToDelete);

            deleteFiles(extractedImages);

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