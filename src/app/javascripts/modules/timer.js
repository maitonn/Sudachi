/**
 * Timer Object
 * @param {Function} func
 * @param {Number} intervalTime
 */

export let Timer = function(func, intervalTime){
  let timerObject = setInterval(func, intervalTime)

  this.stop = () => {
    if (timerObject) {
      clearInterval(timerObject);
      timerObject = null;
    }
    return this;
  }

  this.start = () => {
    if (!timerObject) {
      this.stop();
      timerObject = setInterval(func, intervalTime);
    }
    return this;
  }

  this.reset = (newIntervalTime) => {
    intervalTime = newIntervalTime || intervalTime;
    return this.stop().start();
  }
}
