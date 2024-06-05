export default (connection, action, payload = null) => {
  connection.send(JSON.stringify({ action, payload }));
};
