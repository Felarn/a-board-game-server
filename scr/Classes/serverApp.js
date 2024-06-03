import Game from "./Game.js";
import User from "./User.js";

export default class {
  constructor() {
    this.games = {};
    this.users = {};
  }

  isUserExist(userID) {
    return userID in this.users;
  }

  createUser(connection) {
    const newUser = new User(connection, this);
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
    delete this.games[gameID];
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

  // actions = {
  //   idle: {
  //     registration: (payload) => {
  //       this.newUser;
  //     },
  //     identification: (payload) => {
  //       this.reconnectUser(payload.userID);
  //     },
  //   },
  // };

  // state = "idle";

  // act({ action, payload }) {
  //   if (this.actions[this.state][action])
  //     this.actions[this.state][action](payload);
  // }

  // changeState(newState) {
  //   if (newState in this.actions) this.state = newState;
  //   else throw new Error(`State : ${newState} does not exist`);
  // }
}
