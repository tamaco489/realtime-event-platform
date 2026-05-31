AWS_PROFILE ?= default

.PHONY: fmt lint test build
fmt:
	npx prettier --write "**/*.ts"

lint:
	npx eslint "**/*.ts"

test:
	npm test

build:
	npm run build


.PHONY: synth diff deploy destroy
synth: build
	AWS_PROFILE=$(AWS_PROFILE) npx cdk synth

diff: build
	AWS_PROFILE=$(AWS_PROFILE) npx cdk diff

deploy: build
	AWS_PROFILE=$(AWS_PROFILE) npx cdk deploy --require-approval never

destroy:
	AWS_PROFILE=$(AWS_PROFILE) npx cdk destroy --force


.PHONY: bootstrap
bootstrap:
	AWS_PROFILE=$(AWS_PROFILE) npx cdk bootstrap
