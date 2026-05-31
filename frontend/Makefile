AWS_PROFILE        ?= default
ENV                ?= prd
S3_BUCKET          ?= $(ENV)-realtime-event-frontend
CF_DISTRIBUTION_ID ?=

.PHONY: install up preview
install:
	npm install

up:
	npm run dev

preview: build
	npm run preview


.PHONY: fmt build lint verify
fmt:
	npx prettier --write "src/**/*.{ts,tsx}"

build: fmt
	npm run build

lint:
	npm run lint

verify: build lint


.PHONY: upload deploy
upload: build
	aws s3 sync dist/ s3://$(S3_BUCKET)/ --delete --profile $(AWS_PROFILE)

deploy: upload
	aws cloudfront create-invalidation \
		--distribution-id $(CF_DISTRIBUTION_ID) \
		--paths "/*" \
		--profile $(AWS_PROFILE) | jq .
