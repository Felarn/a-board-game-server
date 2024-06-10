import { v4 as generateID } from "uuid";
import Countdown from "./ExclusiveCountdown.js";
// import sendError from "../utils/sendError.js";
export default class {
  constructor(
    server,
    host,
    gameName,
    terminationTimerSettings = {
      proposeWin: { totalDuration: 20000, reminderInterval: 5000 },
      terminate: { totalDuration: 30000, reminderInterval: 3000 },
    }
  ) {
    this.server = server;
    this.players = [];
    this.host = host;
    // this.gameID = crypto.randomUUID();
    this.gameID = generateID();
    this.gameName = gameName;
    this.openGame = false;
    this.gameHistory = [];
    this.black = null;
    this.white = null;
    this.spectator = null; // заглушка для единообразия, обращений к ней быть не должно
    this.activePlayer = null;
    this.gamePhase = "inLobby";
    this.terminationCountdown = new Countdown(terminationTimerSettings);
  }

  setPrivacy(isPrivate) {
    this.openGame = !isPrivate;
    this.server.updateOpenGamesList();
    this.updatePartisipantsInfo();
  }

  renameGame(newName) {
    this.gameName = newName;
    this.updatePartisipantsInfo();
    this.server.updateOpenGamesList();
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
    this.updatePartisipantsInfo();
  }

  updatePartisipantsInfo() {
    this.players.forEach((player) => {
      console.log("==================================vvvvvvvvvv");
      const playerList = this.getPlayerInfoList();
      console.log(playerList);

      player.send("playerList", {
        playerList,
        whitePlayerName: this.white ? this.white.getName() : "",
        blackPlayerName: this.black ? this.black.getName() : "",
        gameName: this.gameName,
        gameID: this.gameID,
        isPrivate: !this.isOpen(),
      });
    });
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
      this.informEveryone("для запуска игры необходимо 2 игрока");
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
    this.updatePartisipantsInfo();
  }

  removePlayer(user) {
    this.players = this.players.filter((player) => player !== user);
    user.game.informEveryone(`Игрок ${user.getName()} покинул в комнату`);
    user.game = null;
    user.setSide("spectator");
    if (this.getPlayerCount() === 0 && this.gamePhase === "inLobby")
      this.server.deleteGame(this.getID());
    // this.server.updateOpenGamesList();
    this.updatePartisipantsInfo();
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

  // sendToEveryone(message, from) {
  //   this.players.forEach((player) => player.receiveChat(message, from));
  // }

  getGameName() {
    return this.gameName;
  }

  getOnlinePlayers() {
    const playersOnline = [];
    if (this.white.getConnectionStatus() === "online")
      playersOnline.push(this.white);
    if (this.black.getConnectionStatus() === "online")
      playersOnline.push(this.black);
    return playersOnline;
  }

  terminateGame() {
    this.finisGame({
      isDraw: true,
      reason: "оба игрока находились оффлай слишком долго",
    });
  }
  proposeWin(winner) {
    winner.send("winProposal", { ableToDeclareWin: true });
  }

  mangeAbandonedRoom() {
    if (this.getGamePhase() !== "inGame") return;
    const playersOnline = this.getOnlinePlayers();
    switch (playersOnline.length) {
      case 2:
        if (this.terminationCountdown.isActive()) {
          this.terminationCountdown.stop();
          this.informEveryone("оба игрока подключены, игра продолжается");
        }
        playersOnline.forEach((player) =>
          player.send("winProposal", { ableToDeclareWin: false })
        );
        return;

      case 1:
        const winReminder = () => {
          const timeLeft = Math.round(
            this.terminationCountdown.getRemainingDuration() / 1000
          );
          this.informEveryone(
            `Если ${this.getOtherPlayer(
              playersOnline[0]
            ).getName()} не восстановит подключение в течение ${
              timeLeft
            }сек., ${playersOnline[0].getName()} сможет объявить свою победу`
          );
        };

        this.terminationCountdown.start(
          "proposeWin",
          () => this.proposeWin(playersOnline[0]),
          winReminder,
          winReminder
        );

        break;

      case 0:
        const terminationReminder = () => {
          const timeLeft = Math.round(
            this.terminationCountdown.getRemainingDuration() / 1000
          );
          this.informEveryone(
            `Если хотя бы один игрок не подключится в течение ${
              timeLeft
            }сек., игра принудительно завершится ничьей`
          );
        };

        this.terminationCountdown.start(
          "terminate",
          () => this.terminateGame(),
          terminationReminder,
          terminationReminder
        );
        break;

      default:
        break;
    }
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
      player.rememberResult({
        result,
        winnerName: winner && winner.getName(),
        looserName: looser && looser.getName(),
        reason,
      });
      player.act("gameEnded");
    });
    this.players = [];
    this.changeGamePhase("gameEnded");

    this.server.deleteGame(this.getID()); // Если понадобятся реплеи, комнату нужно оставить, не удалять
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
