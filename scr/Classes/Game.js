export default class {
  constructor(server, host) {
    this.server = server;
    this.players = [];
    this.host = host;
    this.gameID = crypto.randomUUID();
    this.gameName = "AnonRoom";
  }

  updatePlayersOnChange() {
    // отправляет всем игрокам пакет со статусом лобби (ники, онлайн-офлайн статус, цвет игроков)
  }

  getPlayerList() {
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
  }

  removePlayer(user) {
    this.players = this.players.filter((player) => player !== user);
    if (this.players.length === 0) this.server.deleteGame(this.getID());
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

  getID() {
    return this.gameID;
  }

  getGameName() {
    return this.gameName;
  }

  turn() {}
}
