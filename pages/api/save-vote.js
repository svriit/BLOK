import { MongoClient, ServerApiVersion } from 'mongodb';

const MONGODB_URI = 'mongodb://svriitkgp:YRzC61aTYX5nJK7j@ac-f7ewbkp-shard-00-00.vsp2bvv.mongodb.net:27017,ac-f7ewbkp-shard-00-01.vsp2bvv.mongodb.net:27017,ac-f7ewbkp-shard-00-02.vsp2bvv.mongodb.net:27017/?replicaSet=atlas-cyik5q-shard-0&ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'Blok';
const COLLECTION_NAME = 'votes';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  const db = client.db(DB_NAME);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

async function ensureSchemaExists(db) {
  const collections = await db.listCollections({ name: COLLECTION_NAME }).toArray();
  if (collections.length === 0) {
    await db.createCollection(COLLECTION_NAME, {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["voteType", "timestamp"],
          properties: {
            voteType: {
              bsonType: "string",
              enum: ["up", "down"],
              description: "Must be 'up' or 'down'",
            },
            timestamp: {
              bsonType: "string",
              description: "Must be a valid ISO date string",
            },
            ipAddress: {
              bsonType: "string",
              description: "Optional IP address of the voter",
            },
            userAgent: {
              bsonType: "string",
              description: "Optional user agent of the voter",
            },
          },
        },
      },
    });
    console.log(`Collection '${COLLECTION_NAME}' created with schema validation.`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { voteType, timestamp } = req.body;

    if (!voteType || !['up', 'down'].includes(voteType)) {
      return res.status(400).json({ error: 'Invalid vote type' });
    }

    const { db } = await connectToDatabase();

    // Ensure schema exists
    await ensureSchemaExists(db);

    const collection = db.collection(COLLECTION_NAME);

    // Insert the vote
    const result = await collection.insertOne({
      voteType,
      timestamp,
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    if (!result.acknowledged) {
      throw new Error('Failed to insert vote into the database');
    }

    // Count the votes
    const upVotes = await collection.countDocuments({ voteType: 'up' });
    const downVotes = await collection.countDocuments({ voteType: 'down' });

    return res.status(200).json({
      success: true,
      upVotes,
      downVotes,
    });
  } catch (error) {
    console.error('Error saving vote:', error);
    return res.status(500).json({ error: 'Failed to save vote', details: error.message });
  }
}