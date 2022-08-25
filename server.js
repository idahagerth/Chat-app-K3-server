const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "*",
  },
});

const date = new Date();
let roomMessageDatabase = [];

const chatDb = require("./models/db.model");
const saveMessage = require("./models/db.model");
const logger = require("./middlewares/logger");

function insertRoom(roomName) {
  chatDb.checkRoom(roomName.room);
}
io.use((socket, next) => {
  console.log("connection middleware one " + socket.id);

  let packet = {
    date: date.toString(),
    socket: socket.id,
  };
  logger.writeConnectionlog(logger.connectionLog, packet);

  next();
});

io.on("connection", (socket, data) => {
  socket.use((data, next) => {
    if (data[0] === "join_room") {
      let packet = {
        date: date.toString(),
        user: data[1].user,
        room: data[1].room,
      };
      logger.writeLog(logger.joinRoomLog, packet);
    } else if (data[0] === "message") {
      let packet = {
        date: date.toString(),
        user: JSON.parse(data[1]).user,
        room: JSON.parse(data[1]).room,
      };
      logger.writeLog(logger.messageLog, packet);
    } else if (data[0] === "leave_room") {
      let packet = {
        date: date.toString(),
        user: data[1].user,
        room: data[1].room,
      };
      logger.writeLog(logger.leaveRoomLog, packet);
    }

    next();
  });
  socket.on("leave_room", (data) => {
    const findRoomId = `SELECT id FROM rooms WHERE name LIKE "${data.room}"`;
    chatDb.chatDb.get(findRoomId, (err, data) => {
      const deleteMessage = `DELETE FROM messages WHERE room_id=${data.id}`;
      chatDb.chatDb.run(deleteMessage);
      const deleteRoom = `DELETE FROM rooms WHERE id=${data.id}`;
      chatDb.chatDb.run(deleteRoom);
    });
    let foundMessages = roomMessageDatabase.filter(
      (object) => object.user === data.user
    );
    for (let i = 0; i < foundMessages.length; i++) {
      delete foundMessages[i];
    }
    roomMessageDatabase = foundMessages;
    socket.leave(data.room);
  });
  socket.on("join_room", (data) => {
    if (socket.rooms.has(data.room)) {
      console.log(`${socket.id} Has already joined ${data.room}`);
    } else {
      console.log(`${socket.id} Has joined ${data.room}`);
      socket.join(data.room);
      insertRoom(data);

      if (roomMessageDatabase.length !== 0) {
        let foundMessages = roomMessageDatabase.filter(
          (object) => object.room === data.room
        );
        for (let i = 0; i < foundMessages.length; i++) {
          if (foundMessages[i].user === data.user) {
            foundMessages[i].origin = "sender";
            socket.emit("message", foundMessages[i]);
          } else if (foundMessages[i].user !== data.user) {
            foundMessages[i].origin = "server";
            socket.emit("message", foundMessages[i]);
          }
        }
      }
    }
  });
  console.log(`${socket.id} Has connected!`);
  socket.on("message", (data) => {
    if (!JSON.parse(data).message) return;
    let youGotMail = {
      origin: "server",
      time: date.toString(),
      user: JSON.parse(data).user,
      message: JSON.parse(data).message,
      room: JSON.parse(data).room,
    };
    let returnToSender = {
      origin: "sender",
      time: date.toString(),
      user: JSON.parse(data).user,
      message: JSON.parse(data).message,
      room: JSON.parse(data).room,
    };

    socket.to(JSON.parse(data).room).emit("message", youGotMail);

    socket.emit("message", returnToSender);

    roomMessageDatabase.push(youGotMail);
    saveMessage.saveMessage(
      youGotMail.room,
      youGotMail.message,
      youGotMail.user
    );

    console.log(JSON.parse(data).room);
    console.log(`${socket.id} Have sent ${data}`);
  });
  socket.on("disconnect", () => {
    console.log(`${socket.id} has disconnected!`);

    let packet = {
      date: date.toString(),
      socket: socket.id,
    };
    logger.writeConnectionlog(logger.disconnectLog, packet);
  });
});

httpServer.listen(process.env.PORT||4000);
