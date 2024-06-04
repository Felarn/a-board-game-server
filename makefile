dev-start:
	npx nodemon index.js

start:
	node index.js

dev-install:
	rm -f production.config
	rm -f developement.config
	echo "{\n\t\"port\":4444\n}" >> developement.config
	npm ci

deploy:
	rm -f production.config
	rm -f developement.config
	echo "{\n\t\"port\":80\n}" >> production.config
	npm ci