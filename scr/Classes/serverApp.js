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

  newUser(connection) {
    const userID = crypto.randomUUID();
    this.users[userID] = new User(userID, connection, this);
    this.users[userID].debugMessage();
    console.log("users: ==============================");
    console.log(this.users);
  }

  reconnectUser(userID, newConnection) {
    this.users[userID].reattachConnection(newConnection);
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
