export default (chai, utils) => {
	const Assertion = chai.Assertion

	Assertion.addMethod('ableToRead', function(path) {
		const user = utils.flag(this, 'object');
		const database = user.database

		this.assert(database.canUserTakeActionOnPath(user, 'read', path),
			`user "${user.uid}" is not able to read ${path}`,
			`user "${user.uid}" is able to read "${path}"`
		)
	})

	Assertion.addMethod('ableToWrite', function(path) {
		const user = utils.flag(this, 'object');
		const database = user.database

		this.assert(database.canUserTakeActionOnPath(user, 'write', path),
			`user "${user.uid}" is not able to read ${path}`,
			`user "${user.uid}" is able to read "${path}"`
		)
	})
}