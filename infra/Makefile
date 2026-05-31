AWS_PROFILE ?= default

.PHONY: fmt build lint test verify
fmt:
	npx prettier --write "**/*.ts"

build: fmt
	npm run build

lint:
	npx eslint "**/*.ts"

test:
	npm test

verify: build lint test


.PHONY: synth diff deploy destroy
synth: build
	AWS_PROFILE=$(AWS_PROFILE) npx cdk synth

diff: build
	AWS_PROFILE=$(AWS_PROFILE) npx cdk diff

deploy: build
	AWS_PROFILE=$(AWS_PROFILE) npx cdk deploy

destroy:
	AWS_PROFILE=$(AWS_PROFILE) npx cdk destroy --force


.PHONY: bootstrap
bootstrap:
	AWS_PROFILE=$(AWS_PROFILE) npx cdk bootstrap
