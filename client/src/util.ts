export const requestAnimFrame = (function(){
  return window.requestAnimationFrame  ||
    window.webkitRequestAnimationFrame ||
    function(callback){
      window.setTimeout(callback, 1000 / 33);
    };
})();