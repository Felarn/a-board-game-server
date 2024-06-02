export default class {
  constructor(userID, connection, server) {
    this.server = server;
    this.state = "outOfGame";
    this.userID = userID;
    this.connection = connection;
    this.userRegistered();

    this.connection.on("message", (data) => {});
    console.log(userID + " created");
  }

  chatMessage(message) {
    this.send("chat", message);
  }

  debugMessage(message) {
    this.send("debug", message);
  }

  userRegistered() {
    this.send("registered", { userID: this.userID });
  }

  send(action, payload = null) {
    this.connection.send(JSON.stringify({ action, payload }));
  }

  reattachConnection(connection) {
    this.connection = connection;
  }

  actions = {
    outOfGame: {
      createGame: (payload) => {},
      join: (payload) => {},
      rename: (payload) => {},
    },

    inLobby: {
      rename: (payload) => {},
      leave: (payload) => {},
      pickSide: (payload) => {},
      startMatch: (payload) => {},
      chat: (payload) => {},
    },

    inGameMakingMove: {
      turn: (payload) => {},
      surrender: (payload) => {},
      chat: (payload) => {},
    },

    inGameSpectating: {
      surrender: (payload) => {},
      chat: (payload) => {},
    },
  };

  act({ action, payload }) {
    if (this.actions[this.state][action])
      this.actions[this.state][action](payload);
  }

  changeState(newState) {
    if (newState in this.actions) this.state = newState;
    else throw new Error(`State : ${newState} does not exist`);
  }
}
