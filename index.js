const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 3000;

// middileware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uvhdimh.mongodb.net/?appName=Cluster0`;

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
      console.log(email);
      const query = {};
      if (email) {
        query.donatorEmail = email;
      }
      const cursor = foodsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Sort foods
    app.get("/featured-foods", async (req, res) => {
      // const projectFields = { name: 1 };
      // .project(projectFields);
      const cursor = foodsCollection.find().sort({ foodQuantity: -1 }).limit(6);
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

    // app.patch("/foods/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const updatedFood = req.body;
    //   const query = { _id: new ObjectId(id) };
    //   const update = {
    //     $set: {
    //       name: updatedFood.name,
    //       price: updatedFood.price,
    //     },
    //   };
    //   const result = await foodsCollection.updateOne(query, update);
    //   res.send(result);
    // });

    app.put("/foods/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedFood = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: updatedFood,
        };
        const result = await foodsCollection.updateOne(filter, updateDoc);
        res.send({ success: true, result });
      } catch (error) {
        console.error("Error updating food:", error);
        res
          .status(500)
          .send({ success: false, message: "Failed to update food" });
      }
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

    app.get("/foods-requests/:id", async (req, res) => {
      const id = req.params.id;
      const query = { foodId: id };
      const cursor = foodsRequestCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.patch("/foods-request/:id/status", async (req, res) => {
      try {
        const id = req.params.id; // this is the _id of the request document
        const { status } = req.body; // new status from client, e.g. "Approved"
        if (!status) {
          return res
            .status(400)
            .send({ error: true, message: "Status is required" });
        }
        const query = { _id: new ObjectId(id) };
        const update = {
          $set: {
            status: status,
          },
        };
        const result = await foodsRequestCollection.updateOne(query, update);
        if (result.matchedCount === 0) {
          return res
            .status(404)
            .send({ error: true, message: "Request not found" });
        }
        res.send({
          success: true,
          message: "Status updated successfully",
          result,
        });
      } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).send({
          error: true,
          message: "Internal server error",
        });
      }
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
