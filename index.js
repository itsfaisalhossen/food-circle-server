const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

// middileware
app.use(cors());
app.use(express.json());

// foodCirlceDb
// mjTrgEOU7rRn0jGc
const uri =
  "mongodb+srv://foodCirlceDb:mjTrgEOU7rRn0jGc@cluster0.uvhdimh.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("Food Circle Server is running.");
});

async function run() {
  try {
    await client.connect();

    const db = client.db("foodCircle_db");
    const usersCollection = db.collection("users");
    const foodsCollection = db.collection("foods");
    const foodsRequestCollection = db.collection("foodsRequest");

    // Users realted apis
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const email = req.body.email;
      const query = { email: email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        res.send({
          message: "User already exist. do not need to insert again",
        });
      } else {
        const result = await usersCollection.insertOne(newUser);
        res.send(result);
      }
    });

    app.get("/users", async (req, res) => {});

    // Foods related apis
    app.get("/foods", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.email = email;
      }
      const cursor = foodsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Sort foods
    app.get("/featured-foods", async (req, res) => {
      const projectFields = { name: 1 };
      // foodQuantity
      const cursor = foodsCollection
        .find()
        .sort({ price: -1 })
        .limit(3)
        .project(projectFields);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.findOne(query);
      res.send(result);
    });

    app.post("/foods", async (req, res) => {
      const newFoods = req.body;
      const result = await foodsCollection.insertOne(newFoods);
      res.send(result);
    });

    app.patch("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const updatedFood = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          name: updatedFood.name,
          price: updatedFood.price,
        },
      };
      const result = await foodsCollection.updateOne(query, update);
      res.send(result);
    });

    app.delete("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.deleteOne(query);
      res.send(result);
    });

    // FoodsRequest realted apis
    app.get("/foods-request", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.email = email;
      }
      const cursor = foodsRequestCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/foods-request", async (req, res) => {
      const newFoodReaquest = req.body;
      const result = await foodsRequestCollection.insertOne(newFoodReaquest);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Smart server is running on port: ${port}`);
});
