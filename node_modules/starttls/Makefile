test: lib/*.js node_modules
	./node_modules/.bin/mocha \
		--reporter dot \
		--check-leaks \
		--ui tdd

node_modules: package.json
	npm install
	touch $@

.PHONY: test
