import get from 'lodash/get'

export default class MockDb {
	rules = null
	data = null

	constructor(rules, data) {
		this.rules = rules.rules || rules
		this.data = data
	}

	getUser(uid) {
		return new DbUser(uid, this)
	}

	canUserWriteToPath(user, path) {
		let currentRulesLevel = this.rules
		return currentRulesLevel['.write']
	}

	canUserTakeActionOnPath(user, action, path) {
		const levels = path.split('/')
		let currentRulesLevel = this.rules
		const context = { auth: user, path: '', root: this.data, vars: {} }

		for(let i = 0; i < levels.length; i++) {
			const levelResult = MockDb.evalRuleLevel(currentRulesLevel, action, context)

			if(levelResult !== null) {
				return levelResult
			}

			context.path += '/' + levels[i]
			const levelKeys = Object.keys(currentRulesLevel)
			if(levelKeys.length === 1 && levelKeys[0].indexOf('$') === 0) {
				const varLevel = levelKeys[0]
				context.vars[varLevel] = levels[i]
				currentRulesLevel = currentRulesLevel[varLevel]
			} else {
				currentRulesLevel = currentRulesLevel[levels[i]]
			}
		}
	}

	static evalRuleLevel(ruleLevel, action, context) {
		if(!ruleLevel) {
			return false
		}

		const rule = ruleLevel['.' + action]
		if(rule !== undefined) {
			return MockDb.evalRule(rule, context)
		}

		return null
	}

	static indexPath(path, vars) {
		const parts = path.split('/')
			.map(p => (p.indexOf('$') !== -1) ? (vars[p.replace('this.vars.', '')]) : p)
		let indexed = parts[0]
		if(parts.length > 1) {
			indexed += '[' + parts.slice(1).join('][') + ']'
		}
		return indexed
	}

	static evalRule(rule, context) {
		if(rule === true || rule === false) {
			return rule
		}

		const contextCopy = {
				...context,
			root: {
		...context.root,
				child: (path) => ({
				exists: () => {
				const newPath = MockDb.indexPath(path, context.vars)
			return get(context.root, newPath) !== undefined
		}
		})
		},
		data: {
			child: (path) => ({
				exists: () => {
				const newPath = MockDb.indexPath(context.path + '/' + path, context.vars)
			return get(context.root, newPath) !== undefined
		}
		})
		}
	}

		const ruleCopy = rule.slice(0)
			.replace(/\bauth/g, 'this.auth')
			.replace(/\broot/g, 'this.root')
			.replace(/\bdata/g, 'this.data')
			.replace(/\$/g, 'this.vars.$')


		const result = (function() {
			return eval(ruleCopy)
		}).call(contextCopy)

		return result
	}
}

class DbUser {
	uid = null
	database = null
	constructor(uid, database) {
		this.uid = uid
		this.database = database
	}
}
