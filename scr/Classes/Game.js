import { v4 as generateID } from "uuid";
// import sendError from "../utils/sendError.js";
export default class {
  constructor(server, host, gameName = `${host.getName()}\`s board`) {
    this.server = server;
    this.players = [];
    this.host = host;
    // this.gameID = crypto.randomUUID();
    this.gameID = generateID();
    this.gameName = gameName;
    this.openGame = true;
    this.gameHistory = [];
    this.black = null;
    this.white = null;
    this.spectator = null; // заглушка для единообразия, обращений к ней быть не должно
    this.activePlayer = null;
  }
  isSideAvailable(side) {
    return side === "spectator" || this[side] === null;
  }

  assignPlayerSide(player, side) {
    console.log(player.getSide());
    this[player.getSide()] = null;
    this[side] = player;
    player.setSide(side);
    this.updateLobbyState();
  }

  updateLobbyState() {
    // отправляет всем игрокам пакет со статусом лобби (ники, онлайн-офлайн статус, цвет игроков)
  }

  startMatch() {
    if (this.black && this.white) {
      this.activePlayer = this.white;
      this.players.forEach((player) => player.changeState("inGame"));
    } else {
      this.informEveryone("нужно 2 игрока");
    }
  }

  getID() {
    return this.gameID;
  }

  getGameName() {
    return this.gameName;
  }

  getPlayerCount() {
    return this.players.length;
  }

  getHostName() {
    return this.host.getName();
  }

  isOpen() {
    return this.openGame;
  }

  getPlayerInfoList() {
    const list = this.players.map((player) => player.getPublicInfo());
    return list;
  }

  addPlayer(user) {
    this.players.push(user);
    this.informEveryone(`Игрок ${user.getName()} вошёл в комнату`);
    user.receiveChat(
      `Вы присоединилсь к комнате "${this.getGameName()}", ID: (${this.getID()})"`,
      "Server"
    );
    this.server.printGames();
    this.server.updateOpenGamesList();
  }

  removePlayer(user) {
    this.players = this.players.filter((player) => player !== user);
    if (this.getPlayerCount() === 0) this.server.deleteGame(this.getID());
    // this.server.updateOpenGamesList();
  }

  printInfo() {
    console.log(
      `gameID: ${this.getID()} | HOST: ${this.host.getName()}(${this.host.getID()}) 
      PLAYERS: ${this.players.map((player) => player.publicInfoString()).join(`\n\t       `)}`
    );
  }

  informEveryone(message) {
    this.sendChatToEveryone(message, "Server");
  }

  sendChatToEveryone(message, from) {
    this.players.forEach((player) => player.receiveChat(message, from));
  }

  getGameName() {
    return this.gameName;
  }

  toggleActivePlayer() {
    this.activePlayer === this.white
      ? (this.activePlayer = this.black)
      : (this.activePlayer = this.white);
  }

  isActivePlayer(player) {
    return this.activePlayer === player;
  }

  turn(gameState) {
    this.gameHistory.push(gameState);
    this.toggleActivePlayer();
    this.players.forEach((player) => player.act("getGameState"));
    this.players.forEach((player) => player.sendRightsToMove());
  }

  getLastGameState() {
    return this.gameHistory.at(-1);
  }

  getGameInfo() {
    const info = {
      gameID: this.getID(),
      gameName: this.getGameName(),
      hostName: this.getHostName(),
      playerCount: this.getPlayerCount(),
    };
    return info;
  }
}
