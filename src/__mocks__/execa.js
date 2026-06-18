class ExecaError extends Error {
	constructor(message = "Command failed", options = {}) {
		super(message)
		this.name = "ExecaError"
		this.exitCode = options.exitCode ?? 1
		this.signal = options.signal
	}
}

const mockFn = (implementation) => (typeof jest === "undefined" ? implementation : jest.fn(implementation))

const createSubprocess = () => {
	const subprocess = Promise.resolve({
		exitCode: 0,
		stdout: "",
		stderr: "",
		all: "",
	})

	subprocess.pid = 1234
	subprocess.iterable = mockFn(async function* () {})
	subprocess.kill = mockFn(() => true)

	return subprocess
}

const execa = mockFn((firstArg) => {
	if (firstArg && typeof firstArg === "object" && !Array.isArray(firstArg)) {
		return mockFn(() => createSubprocess())
	}

	return createSubprocess()
})

module.exports = {
	execa,
	ExecaError,
}
