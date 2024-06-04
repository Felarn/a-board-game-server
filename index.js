import ServerApp from "./scr/Classes/serverApp.js";
import loadConfig from "./scr/utils/loadConfig.js";
import { WebSocketServer } from "ws";
import parseMessage from "./scr/utils/parseMessage.js";
import basicInteractions from "./scr/utils/basicInteractions.js";

const config = loadConfig();
console.log("configurations loaded:");
console.log(config.port);

let wss = new WebSocketServer({ port: config.port });
const serverApp = new ServerApp();

wss.on("connection", (newConnection) => {
  basicInteractions(newConnection);

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
            JSON.stringify({ action: "error", payload: "wrongID" })
          );
          serverApp.createUser(newConnection, payload);
        }
    } catch (err) {
      console.log(err);
      newConnection.send(
        JSON.stringify({
          action: "error",
          payload: {
            trace: JSON.stringify(err, [
              "message",
              "arguments",
              "type",
              "name",
            ]),
          },
        })
      );
    }
  });
});
