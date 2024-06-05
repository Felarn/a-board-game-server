export default (newConnection, err) => {
  console.log(err);
  newConnection.send(
    JSON.stringify({
      action: "error",
      payload: {
        trace: JSON.stringify(err, ["message", "arguments", "type", "name"]),
      },
    })
  );
};
