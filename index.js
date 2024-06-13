import ServerApp from "./scr/Classes/serverApp.js";
import loadConfig from "./scr/utils/loadConfig.js";
import { WebSocketServer } from "ws";
import parseMessage from "./scr/utils/parseMessage.js";
import formatAndSend from "./scr/utils/formatAndSend.js";
import sendError from "./scr/utils/sendError.js";

const config = loadConfig();
console.log("configurations loaded:");
console.log(config.port);

let wss = new WebSocketServer({ port: config.port });
const serverApp = new ServerApp();

wss.on("connection", (newConnection) => {
  formatAndSend(newConnection, "debug", {
    message: "You've connected to Hexlet Chess server",
  });

  newConnection.on("message", (message) => {
    try {
      const { action, payload } = parseMessage(message);

      console.log("\x1b[36m" + action + ":");
      console.log(payload);
      if (action === "registration")
        serverApp.createUser(newConnection, payload);
      if (action === "identification")
        if (serverApp.isUserExist(payload.userID)) {
          serverApp.reconnectUser(payload.userID, newConnection);
        } else {
          newConnection.send(
            JSON.stringify({ action: "error", payload: {worningMessage: "wrongID"} })
          );
          serverApp.createUser(newConnection, payload);
        }
    } catch (err) {
      if (String(message) === "hello" || String(message) === "help")
        newConnection.send(
          "Hi from Hexlet Chess\nYou shold use {acton: %command name%, payload: {%data object%}} format \nto communicate with this server"
        );
      else sendError(newConnection, err);
    }
  });
});
