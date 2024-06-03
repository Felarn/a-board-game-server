import parseMessage from "../utils/parseMessage.js";

export default class {
  constructor(connection, server) {
    this.server = server;
    this.state = "outOfGame";
    this.userID = crypto.randomUUID();
    this.connectionStatus = "online";
    this.userName = "Anon";
    this.game = null;
    this.playerSide = null;
    this.bindConnection(connection);
    this.userRegistered();

    console.log(this.userID + " created");
  }

  send(action, payload = null) {
    this.connection.send(JSON.stringify({ action, payload }));
  }

  getID() {
    return this.userID;
  }

  getState() {
    return this.state;
  }

  getConnectionStatus() {
    return this.connectionStatus;
  }

  getName() {
    return this.userName;
  }

  getSide() {
    return this.playerSide;
  }

  getPublicInfo() {
    return {
      userName: this.getName(),
      side: this.getSide(),
      connectionStatus: this.getConnectionStatus(),
    };
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

  reattachConnection(connection) {
    this.bindConnection(connection);
    this.changeConnectionStatus("online");
    this.send("identified", { userName: this.userName, state: this.state });
  }

  joinGame(gameID) {
    console.log("gameID:" + gameID);
    const gameToConnect = this.server.games[gameID];
    console.log("aaalll of the games:    ===================");
    console.log(this.server.games);
    if (gameToConnect) {
      gameToConnect.addPlayer(this);
      this.game = gameToConnect;
    }
  }

  leaveGame(gameID) {
    if (this.game === null) throw new Error("Not in the game");
    this.game.removePlayer(this);
    this.game = null;
  }

  rename(newName) {
    this.userName = newName;
  }

  printInfo() {
    console.log("ID: " + this.getID());
    console.log("userName: " + this.getName());
    console.log("userName: " + this.state);
  }

  privateInfoString() {
    return `${this.getID()}: ${this.getName()} | STATE: ${this.getState()} | CONNECTION: ${this.getConnectionStatus()} | STATE: ${this.getState()}`;
  }

  publicInfoString() {
    return `NAME: ${this.getName()} | STATE: ${this.getState()} | CONNECTION: ${this.getConnectionStatus()} | SIDE: ${this.getSide()}`;
  }

  changeConnectionStatus(newStatus) {
    this.connectionStatus = newStatus;
    if (newStatus === "offline") this.connection = null;
  }

  act(action, payload = null) {
    if (this.actions[this.state][action])
      this.actions[this.state][action](payload);
  }

  changeState(newState) {
    if (newState in this.actions) this.state = newState;
    else throw new Error(`State : ${newState} does not exist`);
  }

  bindConnection(connection) {
    this.connection = connection;
    this.connection.on("message", (data) => {
      const { action, payload } = parseMessage(data);
      this.act(action, payload);
    });

    this.connection.on("close", (data) => {
      console.log("connection closed with " + this.getID());
      this.act("disconnect");
    });

    this.connection.on("error", (data) => {
      console.log("connection lost with " + this.getID());
      this.act("disconnect");
    });
  }

  actions = {
    outOfGame: {
      createGame: (payload) => {
        console.log("starting new game");
        const gameID = this.server.createNewGame(this);
        this.joinGame(gameID);
        this.changeState("inLobby");
      },
      join: (payload) => {
        console.log("joining");
        this.joinGame(payload.gameID);
        this.changeState("inLobby");
      },
      rename: (payload) => {
        this.rename(payload.userName);
      },
      disconnect: (payload) => {
        this.changeConnectionStatus("offline");
        this.changeState("outOfGame");
      },
    },

    inLobby: {
      rename: (payload) => {
        this.rename(payload.userName);
      },
      leave: (payload) => {
        this.leaveGame();
        this.changeState("outOfGame");
      },
      pickSide: (payload) => {},
      startMatch: (payload) => {},
      chat: (payload) => {},
      disconnect: (payload) => {
        this.leaveGame();
        this.changeState("outOfGame");
        this.changeConnectionStatus("offline");
      },
    },

    inGameMakingMove: {
      win: (payload) => {},
      draw: (payload) => {},
      turn: (payload) => {},
      surrender: (payload) => {},
      chat: (payload) => {},
      disconnect: (payload) => {
        this.changeConnectionStatus("offline");
        // оповестить игроков о потере соединения
      },
    },

    inGameSpectating: {
      surrender: (payload) => {},
      chat: (payload) => {},
      disconnect: (payload) => {
        this.changeConnectionStatus("offline");
        // оповестить игроков о потере соединения
      },
    },
  };
}
