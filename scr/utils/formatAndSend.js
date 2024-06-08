export default (connection, action, payload = null) => {
  const stringToSend = JSON.stringify({ action, payload });
  // console.log(stringToSend);
  connection.send(stringToSend);
};
