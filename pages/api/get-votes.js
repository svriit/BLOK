import { MongoClient, ServerApiVersion } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI; // Use environment variable
const DB_NAME = 'Blok';
const COLLECTION_NAME = 'votes';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

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
          },
        },
      },
    });
    console.log(`Collection '${COLLECTION_NAME}' created with schema validation.`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { db } = await connectToDatabase();

    // Ensure schema exists
    await ensureSchemaExists(db);

    const collection = db.collection(COLLECTION_NAME);

    // Count the votes
    const upVotes = await collection.countDocuments({ voteType: 'up' });
    const downVotes = await collection.countDocuments({ voteType: 'down' });

    return res.status(200).json({
      upVotes,
      downVotes,
    });
  } catch (error) {
    console.error('Error getting votes:', error);
    return res.status(500).json({ error: 'Failed to get votes', details: error.message });
  }
}