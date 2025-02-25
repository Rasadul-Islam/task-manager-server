const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dzkk6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// MongoDB Client Setup
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    // await client.connect();

    const TaskCollection = client.db('task-manager').collection('tasks');
    const usersCollection = client.db('task-manager').collection('users');



    // Store User informatin if not exists on to the database
    app.post('/users', async (req, res) => {
      const userData = req.body;
      // Check if user already exists using a unique field (e.g., email)
      const existingUser = await usersCollection.findOne({ email: userData.email });
      if (existingUser) {
        return res.send({ message: "User already exists", user: existingUser });
      }
      // Insert new user
      const result = await usersCollection.insertOne(userData);
      res.send({ message: "User created successfully", insertedId: result.insertedId });
    });

    // Task Add API (Order Field)
    app.post('/tasks', async (req, res) => {
      const newTask = req.body;
      const totalTasks = await TaskCollection.countDocuments();
      newTask.order = totalTasks; 
      const result = await TaskCollection.insertOne(newTask);
      res.send(result);
    });

    // Get Tasks of Logged-in User
    app.get('/tasks', async (req, res) => {
      const userMail = req.query.mail;
      const query = { mail: userMail };
      const result = await TaskCollection.find(query).sort({ order: 1 }).toArray();
      res.send(result);
    });

    // Delete Task API
    app.delete('/tasks/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await TaskCollection.deleteOne(query);
      res.send(result);
    });

    //  Task Update
    app.put('/tasks/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedTask = req.body;

      const update = {
        $set: {
          title: updatedTask.title,
          description: updatedTask.description,
          category: updatedTask.category,
        }
      };

      const result = await TaskCollection.updateOne(query, update, { upsert: false });
      res.send(result);
    });

    //  Task Order & Category Update API (Drag-and-Drop Handle)
    app.put('/updateTaskOrder/:id', async (req, res) => {
      const id = req.params.id;
      const { category, order } = req.body;
      const query = { _id: new ObjectId(id) };
      const update = { $set: { category, order } };
      const result = await TaskCollection.updateOne(query, update, { upsert: false });
      res.send(result);
    });




  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send("Task Manager server is running");
});

app.listen(port, () => {
  console.log(`Task Manager server is running on port: ${port}`);
});