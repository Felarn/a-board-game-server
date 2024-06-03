export default class {
  constructor(server, host) {
    this.server = server;
    this.players = [];
    this.host = host;
    this.gameID = crypto.randomUUID();
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
    // оповестить игроков об изменениях в комнате
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

  getID() {
    return this.gameID;
  }

  turn() {}
}
