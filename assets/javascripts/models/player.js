var Player = function(clientID) {
	var xLocation
	var yLocation
	var id = clientID
	var alias;
	var bank = 0

	var getX = function() {
      return xLocation;
  };

  var getY = function() {
      return yLocation;
  };

  var setX = function(newX) {
      xLocation = newX;
  };

  var setY = function(newY) {
      yLocation = newY;
  };

  var setAlias = function(newAlias) {
  	alias = newAlias
  }

  var addBank = function(addValue) {
  	bank += addValue
  }

  var subBank = function(subValue) {
  	bank -= subValue
  }

	return {
		id: id,
		x: xLocation,
		y: yLocation,
		location: {x: getX, y: getY},
		setX: setX,
		setY: setY,
		alias: alias,
		setAlias: setAlias,
		bank: bank,
		addBank: addBank,
		subBank: subBank
	}


}

exports.Player = Player