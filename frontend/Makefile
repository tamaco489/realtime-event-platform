AWS_PROFILE        ?= default
ENV                ?= prd
S3_BUCKET          ?= $(ENV)-realtime-event-frontend
CF_DISTRIBUTION_ID ?=

.PHONY: setup-tools
setup-tools:
	cp .env.example .env.local


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


.PHONY: upload deploy cf-status
upload: build
	aws s3 sync dist/ s3://$(S3_BUCKET)/ --delete --profile $(AWS_PROFILE)

deploy: upload
	$(eval CF_DISTRIBUTION_ID := $(shell aws cloudfront list-distributions \
		--query "DistributionList.Items[?Origins.Items[?contains(DomainName,'$(S3_BUCKET)')]].Id | [0]" \
		--output text \
		--profile $(AWS_PROFILE)))
	aws cloudfront create-invalidation \
		--distribution-id $(CF_DISTRIBUTION_ID) \
		--paths "/*" \
		--profile $(AWS_PROFILE) | jq .

cf-status:
	$(eval CF_DISTRIBUTION_ID := $(shell aws cloudfront list-distributions \
		--query "DistributionList.Items[?Origins.Items[?contains(DomainName,'$(S3_BUCKET)')]].Id | [0]" \
		--output text \
		--profile $(AWS_PROFILE)))
	aws cloudfront list-invalidations \
		--distribution-id $(CF_DISTRIBUTION_ID) \
		--profile $(AWS_PROFILE) | jq '.InvalidationList.Items[0].Status'
