const sqlite3 = require("sqlite3").verbose();
const dbFile = "./db/chatDatabas.sqlite";
const { Client } = require("pg");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

client.connect();

client.query(
  'CREATE TABLE IF NOT EXISTS "users" ("id" TEXT, "name" TEXT);',
  (error) => {
    if (error) {
      console.error(error.message);
      throw error;
    }
    const sql = "INSERT INTO users (id, name) VALUES ($1, $2)";
    client.query(sql, ["user1", "user1"]);
    client.query(sql, ["user2", "user2"]);
    client.query(sql, ["user3", "user3"]);

    return;
  }
);

client.query(
  'CREATE TABLE IF NOT EXISTS "rooms" (id SERIAL PRIMARY KEY, "name" TEXT)',
  (error) => {
    if (error) {
      console.error(error.message);
      throw error;
    }
    const sql = "INSERT INTO rooms (name) VALUES ($1)";
    client.query(sql, ["room1"]);
    client.query(sql, ["room2"]);
    client.query(sql, ["room3"]);

    return;
  }
);

client.query(
  'CREATE TABLE IF NOT EXISTS "messages" (id SERIAL PRIMARY KEY, "message" TEXT, "room_id" INT, "user_id" TEXT);',
  (error) => {
    if (error) {
      console.error(error.message);
      throw error;
    }
    return;
  }
);

const chatDb = new sqlite3.Database(dbFile, (error) => {
  if (error) {
    console.error(error.message);
    throw error();
  }
  console.log("Connected to db");
  const rooms = `CREATE TABLE rooms (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)`;
  const users = `CREATE TABLE users (id TEXT, name TEXT)`;
  const messages = `CREATE TABLE messages (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT, room_id INT, user_id TEXT)`;

  chatDb.run(users, (error) => {
    if (error) {
      console.log("table users already exists!");
      return;
    }
    const insert = "INSERT INTO users (id, name) VALUES(?, ?)";
    chatDb.run(insert, ["user1", "user1"]);
    chatDb.run(insert, ["user2", "user2"]);
    chatDb.run(insert, ["user3", "user3"]);
  });
  chatDb.run(rooms, (error) => {
    if (error) {
      console.log("Room already exists");
      return;
    }
    const insert = "INSERT INTO rooms (name) VALUES (?)";
    chatDb.run(insert, "room1");
    chatDb.run(insert, "room2");
    chatDb.run(insert, "room3");
  });
  chatDb.run(messages, (error) => {
    if (error) {
      console.log("messages already exists");
      return;
    }
  });
});
let roomId;
let userId;

function saveMessage(room, message, user) {
  const findRoom = "SELECT id FROM rooms WHERE name LIKE $1";

  const findUserId = "SELECT id FROM users WHERE name LIKE $1";

  client.query(findRoom, [room], (err, data) => {
    return (roomId = JSON.stringify(data.rows[0].id));
  });

  client.query(findUserId, [user], (err, data) => {
    console.log(
      "User id is " +
        data.id +
        " or " +
        data +
        " or " +
        JSON.stringify(data.rows[0].id)
    );

    return (userId = JSON.stringify(data.rows[0].id));
  });
  const insertMessage = `INSERT INTO messages (message, room_id, user_id) VALUES ($1, $2, $3)`;
  client.query(insertMessage, [message, roomId, userId]);
}

function checkRoom(roomName) {
  const findRoom = "SELECT id FROM rooms WHERE name LIKE $1";

  client.query(findRoom, [roomName], (err, data) => {
    if (data) {
      console.log("room exists " + roomName);
    } else {
      console.log("room does not exist");
      const insert = "INSERT INTO rooms (name) VALUES ($1)";
      client.query(insert, roomName);
    }
  });
}

module.exports = { chatDb, saveMessage, checkRoom };
