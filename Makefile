.PHONY: run

run:
	@(cd functions; npm install && npm run build && firebase serve --only functions)