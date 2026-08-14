.DEFAULT_GOAL := help

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-10s\033[0m %s\n",$$1,$$2}'

dev: ## Dev server with hot reload on :3000
	@test -f .env || cp .env.example .env
	npm run dev

build: ## Generate the static bundle into .output/public
	@test -f .env || cp .env.example .env
	npm run generate

preview: build ## Serve the generated bundle on :3000 with an SPA fallback
	npx --yes serve -s .output/public -l 3000

lint: ## Type-check
	npx nuxi typecheck

.PHONY: help dev build preview lint
