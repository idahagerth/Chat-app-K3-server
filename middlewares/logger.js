const fs = require("fs");

const connectionLog = "./logs/connectionlog.txt";
const joinRoomLog = "./logs/joinroomlog.txt";
const messageLog = "./logs/messageLog.txt";
const leaveRoomLog = "./logs/leaveroomlog.txt";
const disconnectLog = "./logs/disconnectlog.txt";

const allLogs = [
  connectionLog,
  joinRoomLog,
  messageLog,
  leaveRoomLog,
  disconnectLog,
];

const createLog = (file) => {
  if (fs.existsSync(file)) {
    console.log(file + " exists");
  } else {
    fs.writeFile(file, "", function (err, result) {
      if (err) console.log("error", err);
    });
  }
};

const writeLog = (file, message) => {
  messageWrite = message.date + " " + message.user + " " + message.room;
  fs.appendFile(file, messageWrite + "\n", function (err, result) {
    if (err) console.log("error", err);
  });
};
const writeConnectionlog = (file, message) => {
  messageWrite = message.date + " " + message.socket;
  fs.appendFile(file, messageWrite + "\n", function (err, result) {
    if (err) console.log("error", err);
  });
};

for (let i = 0; i < allLogs.length; i++) {
  createLog(allLogs[i]);
}
module.exports = {
  createLog,
  writeLog,
  connectionLog,
  joinRoomLog,
  messageLog,
  leaveRoomLog,
  disconnectLog,
  writeConnectionlog,
};
