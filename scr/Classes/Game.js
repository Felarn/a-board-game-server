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
    this.gamePhase = "inLobby";
  }

  actEveryone(action) {
    this.players.forEach((player) => player.act(action));
  }

  isSideAvailable(side) {
    return side === "spectator" || this[side] === null;
  }

  assignPlayerSide(player, side) {
    this[player.getSide()] = null;
    this[side] = player;
    player.setSide(side);
    this.updateLobbyState();
  }

  updateLobbyState() {
    // отправляет всем игрокам пакет со статусом лобби (ники, онлайн-офлайн статус, цвет игроков)
  }

  changeGamePhase(newPhase) {
    this.gamePhase = newPhase;
    this.server.updateOpenGamesList();
    this.players.forEach((player) => player.changeState(this.getGamePhase()));
  }

  getGamePhase() {
    return this.gamePhase;
  }

  startMatch(payload) {
    if (this.black && this.white) {
      this.gameHistory.push(payload);
      this.activePlayer = this.white;
      this.changeGamePhase("inGame");
      this.actEveryone("sendGameState");
      this.actEveryone("sendTurnState");
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
    return (
      this.openGame &&
      (this.gamePhase === "inLobby" || this.gamePhase === "inGame")
    );
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
    user.game.informEveryone(`Игрок ${user.getName()} покинул в комнату`);
    user.game = null;
    user.setSide("spectator");
    if (this.getPlayerCount() === 0 && this.gamePhase === "inLobby")
      this.server.deleteGame(this.getID());
    // this.server.updateOpenGamesList();
  }

  kickEveryoneToLobby() {
    this.players.forEach((player) => this.removePlayer(player));
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

  getOtherPlayer(playerOne) {
    if (playerOne === this.white) return this.black;
    if (playerOne === this.black) return this.white;
  }

  finisGame({
    isDraw,
    winner = null,
    looser = null,
    reason = "for no reason",
  }) {
    if (!isDraw) {
      if (winner) looser = this.getOtherPlayer(winner);
      if (looser) winner = this.getOtherPlayer(looser);
    }
    this.changeGamePhase("onResultScreen");
    this.players.forEach((player) => {
      player.game = null;
      player.setSide("spectator");
      let result = isDraw ? "draw" : "score";
      if (player === winner) result = "youWon";
      if (player === looser) result = "youLoose";

      player.send("gameEnded", {
        result,
        winnerName: winner && winner.getName(),
        looserName: looser && looser.getName(),
        reason,
      });
    });
    this.players = [];
    this.changeGamePhase("gameEnded");
  }

  isActivePlayer(player) {
    return this.activePlayer === player;
  }

  turn(gameState) {
    this.gameHistory.push(gameState);
    this.toggleActivePlayer();
    this.actEveryone("sendGameState");
    this.actEveryone("sendTurnState");
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
