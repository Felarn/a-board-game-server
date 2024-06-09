export default class {
  constructor(timerTypeSettings = {}) {
    timerTypeSettings.default = {
      totalDuration: 30000,
      reminderInterval: 10000,
    };
    this.timerTypeSettings = timerTypeSettings;
    this.countdown = null;
    this.reminder = null;
    this.startTime = null;
    this.timerType = null;
  }

  isActive() {
    return this.countdown ? true : false;
  }

  start(
    newType,
    onFinishCallback,
    reminderCallback = () => {},
    onStartCallback = () => {}
  ) {
    if (newType === this.getType())
      return console.log(`timer-type of "${this.getType()}" is already set`);
    this.stop();

    const { totalDuration, reminderInterval } =
      this.getTimerSettingsOfType(newType);
    this.setType(newType);
    console.log(
      `new timer of type "${this.getType()}" started, duration ${totalDuration}ms, reminder interval: ${reminderInterval}ms`
    );
    this.startTime = new Date();
    this.countdown = setTimeout(() => {
      onFinishCallback();
      this.stop();
    }, totalDuration);

    this.reminder = setInterval(() => {
      if (this.getRemainingDuration() > reminderInterval / 2)
        reminderCallback();
    }, reminderInterval);
    onStartCallback();
  }

  stop() {
    if (!this.isActive()) return;
    console.log(`Timer of type: "${this.getType()}" stopped`);
    clearTimeout(this.countdown);
    clearTimeout(this.reminder);
    this.countdown = null;
    this.reminder = null;
    this.timerType = null;
  }
  getTimerSettingsOfType(type) {
    return this.timerTypeSettings[type]
      ? this.timerTypeSettings[type]
      : this.timerTypeSettings.default;
  }
  getFullDuration() {
    if (!this.isActive()) return console.log("timer isn't set");
    const { totalDuration } = this.getTimerSettingsOfType(this.getType());
    return totalDuration;
  }
  getRemainingDuration() {
    if (!this.isActive) return;
    return this.getFullDuration() - (new Date() - this.startTime);
  }
  setType(newType) {
    this.timerType = newType;
  }

  getType() {
    return this.timerType;
  }
}
