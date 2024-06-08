import formatAndSend from "../utils/formatAndSend.js";
import parseMessage from "../utils/parseMessage.js";
import { v4 as generateID } from "uuid";
import sendError from "../utils/sendError.js";

export default class {
  constructor(connection, userName = "Anon", server) {
    this.server = server;
    this.state = "outOfGame";
    // this.userID = crypto.randomUUID();
    this.userID = generateID();
    this.connectionStatus = "online";
    this.userName = userName;
    this.game = null;
    this.playerSide = null;
    this.bindConnection(connection);
    this.userRegistered();
    this.side = "spectator";

    console.log(this.userID + " created");
  }

  send(action, payload = null) {
    if (this.connection) formatAndSend(this.connection, action, payload);
  }

  setSide(side) {
    this.side = side;
    this.send("yourSide", { side: this.getSide() });
  }

  getSide() {
    return this.side;
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

  isYourTurn() {
    return this.game.activePlayer === this;
  }

  getPublicInfo() {
    return {
      userName: this.getName(),
      side: this.getSide(),
      connectionStatus: this.getConnectionStatus(),
    };
  }

  receiveChat(message, from) {
    this.send("chat", { message, from });
  }

  sendChat(message) {
    this.game.sendChatToEveryone(message, this.getName());
  }

  debugMessage(message) {
    this.send("debug", message);
  }

  userRegistered() {
    this.send("registered", { userID: this.userID });
    this.act("sendOpenGamesList");
  }

  reattachConnection(connection) {
    this.bindConnection(connection);
    this.changeConnectionStatus("online");
    this.send("identified", {
      userName: this.userName,
      userCondition: this.state,
    });
    this.send("yourSide", { side: this.getSide() });
    this.act("sendOpenGamesList");
    this.act("sendGameState");
    this.act("sendTurnState");
  }

  joinGame(gameID) {
    console.log("gameID:" + gameID);
    const gameToConnect = this.server.games[gameID];
    console.log("aaalll of the games:    ===================");
    console.log(this.server.games);
    if (gameToConnect) {
      gameToConnect.addPlayer(this);
      this.game = gameToConnect;
      this.changeState(this.game.getGamePhase());
      this.act("sendGameState");
      this.act("sendTurnState");
    } else {
      this.receiveChat("комнаты с таким ID не существует", "server");
    }
  }

  leaveGame(gameID) {
    if (this.game === null)
      throw new Error("Can't leave. Not currently in the game");
    this.game.informEveryone(`Игрок ${this.getName()} покинул в комнату`);
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
    return `${this.getID()}: ${this.getName()} | STATE: ${this.getState()} | CONNECTION: ${this.getConnectionStatus()}`;
  }

  publicInfoString() {
    return `NAME: ${this.getName()} | STATE: ${this.getState()} | CONNECTION: ${this.getConnectionStatus()} | SIDE: ${this.getSide()}`;
  }

  changeConnectionStatus(newStatus) {
    this.connectionStatus = newStatus;
    if (newStatus === "offline") this.connection = null;
  }

  act(action, payload = null) {
    try {
      if (this.actions[this.state][action])
        this.actions[this.state][action](payload);
    } catch (error) {
      sendError(this.connection, error);
    }
  }

  changeState(newState) {
    if (newState in this.actions) {
      this.state = newState;
      this.send("newUserCondition", { userCondition: this.state });
      this.server.updateOpenGamesList();
    } else throw new Error(`State : ${newState} does not exist`);
  }

  bindConnection(connection) {
    clearTimeout(this.disconnectionTimer);
    this.connection = connection;
    this.connection.on("message", (data) => {
      try {
        const { action, payload } = parseMessage(data);
        this.act(action, payload);
      } catch (err) {
        sendError(this.connection, err);
      }
    });

    this.connection.on("close", (data) => {
      console.log("connection closed with " + this.getID());
      this.disconnectionTimer = setTimeout(() => this.act("disconnect"), 2000);
    });

    this.connection.on("error", (data) => {
      console.log("connection lost with " + this.getID());
      this.disconnectionTimer = setTimeout(() => this.act("disconnect"), 2000);
    });
  }

  actions = {
    outOfGame: {
      sendOpenGamesList: (payload) => {
        this.send("roomsList", { list: this.server.getOpenGamesList() });
      },
      createGame: (payload) => {
        console.log("starting new game");
        const gameID = this.server.createNewGame(this);
        this.joinGame(gameID);
      },
      join: (payload) => {
        console.log("joining");
        this.joinGame(payload.gameID);
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
      renameGame: (payload) => {},
      leave: (payload) => {
        this.leaveGame();
        this.changeState("outOfGame");
      },
      pickSide: ({ side }) => {
        if (this.game.isSideAvailable(side)) {
          this.game.assignPlayerSide(this, side);
        } else this.receiveChat("сторона недоступна", "server");
      },
      startMatch: (payload) => {
        this.game.startMatch(payload);
      },
      chat: (payload) => {
        this.sendChat(payload.message);
      },
      disconnect: (payload) => {
        this.leaveGame();
        this.changeState("outOfGame");
        this.changeConnectionStatus("offline");
      },
    },

    inGame: {
      sendTurnState: () => {
        const turnState = {
          activePlayer: this.game.activePlayer.getName(),
          activeSide: this.game.activePlayer.getSide(),
          isYourTurn: this.isYourTurn(),
        };
        this.send("turnState", turnState);
      },
      sendGameState: () => {
        this.send("gameState", this.game.getLastGameState());
      },
      win: (payload) => {},
      draw: (payload) => {},
      makeTurn: (payload) => {
        if (this.game.isActivePlayer(this)) this.game.turn(payload);
        else this.receiveChat("не твой ход", "server");
      },
      surrender: (payload) => {},
      chat: (payload) => {
        this.sendChat(payload.message);
      },
      disconnect: (payload) => {
        this.changeConnectionStatus("offline");
        // оповестить игроков о потере соединения
      },
    },

    onResultScreen: {
      surrender: (payload) => {},
      chat: (payload) => {
        this.sendChat(payload.message);
      },
      disconnect: (payload) => {
        this.changeConnectionStatus("offline");
        // оповестить игроков о потере соединения
      },
    },
  };
}
