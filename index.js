import ServerApp from "./scr/Classes/serverApp.js";
import loadConfig from "./scr/utils/loadConfig.js";
import { WebSocketServer } from "ws";
import parseMessage from "./scr/utils/parseMessage.js";

const config = loadConfig();
console.log("configurations loaded:");
console.log(config.port);

let wss = new WebSocketServer({ port: config.port });
const serverApp = new ServerApp();

wss.on("connection", (newConnection) => {
  //   serverApp.newUser(newConnection);
  newConnection.on("message", (message) => {
    const { action, payload } = parseMessage(message);
    console.log("\x1b[36m" + action + ":");
    console.log(payload);
    if (action === "registration") serverApp.newUser(newConnection);
    if (action === "identification")
      if (serverApp.isUserExist(payload.userID)) {
        serverApp.reconnectUser(payload.userID, newConnection);
      } else {
        newConnection.send(
          JSON.stringify({ action: "error", payload: "wrongID" })
        );
        serverApp.newUser(newConnection);
      }
  });
});
