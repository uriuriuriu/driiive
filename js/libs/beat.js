/*!
 * beat.js - This script drives the events in bpm base.
 * from uriuriuriu https://github.com/uriuriuriu/beat.js
 *
 * var beatJs = new beatJs({
 *   bpm: 120,
 *   rhythm:[4,4,4,2,2], // set to 16 in total.
 *   repeat: true
 * });
 * beatJs.push(pre_callback1);
 * beatJs.push(pre_callback2);
 * beatJs.run();
 * beatJs.stop();
 *
 */
(function(window){
  'use strict';
  function beatJs(options){
    var options = $.extend({
      bpm: 120,
      rhythm:[4,4,4,2,2],
      repeat: true
    }, options);
    this.options = options;
    this.isRun = false;
    this.rhythmCnt = 0;
    this.oneBeatMsec = 0;
    this.cnt = 0;
    this.animationID = "";
    this.startTime = 0;
    this.queue = [];
    this.rhythmMaxCnt = this.options.rhythm.length - 1;
  }
  beatJs.prototype.push = function(pre_callback){
    this.queue.push(pre_callback);
  };
  beatJs.prototype.run = function(){
    this.isRun = true;
    this.cnt = this.rhythmCnt = 0;
    this.startTime = new Date().getTime();
    this.oneBeatMsec = 15000 / this.options.bpm;
    var self = this;
    var queueCount = self.queue.length;
    function main(){
      self.queue[self.cnt%queueCount]();
      self.cnt++;
    }
    function checkUpdate(){
      var rhythm = self.options.rhythm[self.rhythmCnt];
      var now = new Date().getTime();
      var bool = false;
      if (self.oneBeatMsec * rhythm <= (now - self.startTime)) {
        self.startTime = now;
        self.rhythmCnt = (self.rhythmCnt + 1) % self.options.rhythm.length;
        bool = true;
      }
      return bool;
    };
    function loop(){
      if(!self.options.repeat && (self.rhythmMaxCnt < self.cnt)){
        self.stop();
        self.cnt = self.rhythmCnt = 0;
      }else{
        self.animationID = requestAnimationFrame( loop );
        if(checkUpdate()){
          main();
        };
      };
    };
    main();
    loop();
  };

  beatJs.prototype.stop = function(){
    this.isRun = false;
    cancelAnimationFrame(this.animationID);
  };

  window.requestAnimationFrame = (function() {
    return window.requestAnimationFrame ||
           window.webkitRequestAnimationFrame ||
           window.mozRequestAnimationFrame ||
           window.msRequestAnimationFrame ||
           window.oRequestAnimationFrame ||
           function(f) { return window.setTimeout(f, 1000 / 60); };
  }());
  window.cancelAnimationFrame = (function() {
  return window.cancelAnimationFrame ||
         window.cancelRequestAnimationFrame ||
         window.webkitCancelAnimationFrame ||
         window.webkitCancelRequestAnimationFrame ||
         window.mozCancelAnimationFrame ||
         window.mozCancelRequestAnimationFrame ||
         window.msCancelAnimationFrame ||
         window.msCancelRequestAnimationFrame ||
         window.oCancelAnimationFrame ||
         window.oCancelRequestAnimationFrame ||
         function(id) { window.clearTimeout(id); };
  }());

  window.beatJs = beatJs;

})(window);
