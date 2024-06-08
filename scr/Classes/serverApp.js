import Game from "./Game.js";
import User from "./User.js";

export default class {
  constructor() {
    this.games = {};
    this.users = {};
    this.openGamesList = [];
    this.outOfGameUsers = this.users;
  }

  getAllGames() {
    return Object.values(this.games);
  }

  updateOpenGamesList() {
    const newList = this.getAllGames().reduce((list, game) => {
      if (game.isOpen()) {
        list.push(game.getGameInfo());
      }
      return list;
    }, []);
    this.openGamesList = newList;
    this.sendOpenGamesListToUsers();
  }

  sendOpenGamesListToUsers() {
    this.getUsersOutOfGame().forEach((user) => user.act("sendOpenGamesList"));
  }

  // printGames;

  getUsersOutOfGame() {
    return Object.values(this.outOfGameUsers); // сейчас это все доступные пользователи
  }

  getOpenGamesList() {
    return this.openGamesList.reverse();
  }

  isUserExist(userID) {
    return userID in this.users;
  }

  isGameExist(gameID) {
    return gameID in this.games;
  }

  createUser(connection, payload) {
    const userName = payload ? payload.userName : "Anon";
    const newUser = new User(connection, userName, this);
    const userID = newUser.getID();
    this.users[userID] = newUser;
    this.printUsers();
  }

  reconnectUser(userID, newConnection) {
    this.users[userID].reattachConnection(newConnection);
    console.log("reconneced " + userID);
    this.printUsers();
  }

  createNewGame(host) {
    const newGame = new Game(this, host);
    const gameID = newGame.getID();
    this.games[gameID] = newGame;
    // this.printGames();
    return gameID;
  }

  deleteGame(gameID) {
    if (this.isGameExist(gameID)) delete this.games[gameID];
    this.printGames();
  }

  printGames() {
    console.log("=========== GAMES  ===================");
    // console.log(Object.keys(this.games));
    Object.values(this.games).forEach((game) => {
      game.printInfo();
    });
  }

  printUsers() {
    console.log("===========  USERS  ===================");
    console.log(
      Object.values(this.users).map((user) => user.privateInfoString())
    );
  }
}
