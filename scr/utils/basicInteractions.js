import parseMessage from "./parseMessage.js";

export default (connection) => {
  connection.send(
    JSON.stringify({
      action: "debug",
      payload: { message: "You've connected to Hexlet Chess server" },
    })
  );

  connection.on("message", (message) => {
    if (String(message) === "hello") connection.send("hi from Hexlet Chess");
  });
};
