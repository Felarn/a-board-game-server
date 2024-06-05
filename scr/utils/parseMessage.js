export default (message) => {
  try {
    const data = JSON.parse(message);
    return data;
  } catch (e) {
    throw new Error("Incorrect message format, should be JSON");
  }
};
