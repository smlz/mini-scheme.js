
// this is a small function to play with and demonstrate the use of generator functions


function* recu(level, currval) {
	if (currval < 3) {
		console.log('hello: ' + currval + ' level: ' + level);
		currval += 1;
		final = yield* recu(level+1, currval);
	} else {
		console.log('returning from level: ' + level + ' with currval: ' + currval);
		return currval;
	}
	debugger;
	return final;
}