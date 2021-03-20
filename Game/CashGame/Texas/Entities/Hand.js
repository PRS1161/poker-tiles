var Sys = require('../../../../Boot/Sys');

class Hand {
  constructor(player, board) {

    console.log("Board >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>",board.length)

    if(board.length == 6){
      board.pop();
    }
    this.player = player;
    this.board = board;
    this.cards = player.concat(board);
  }
}
module.exports = Hand
