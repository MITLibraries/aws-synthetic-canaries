SHELL=/bin/bash
DATETIME:=$(shell date -u +%Y%m%dT%H%M%SZ)

.PHONY: help install update test coveralls

# Discover Javascript/Node projects: immediate subdirectories that contain 
# a nodejs/package.json
PROJECT_DIRS := $(shell for d in ./*/ ; do if [ -f "$$d/nodejs/package.json" ]; then echo $${d%/} ; fi ; done)

help: # Preview Makefile commands
	@awk 'BEGIN { FS = ":.*#"; print "Usage:  make <target>\n\nTargets:" } \
		/^[-_[:alpha:]]+:.?*#/ { printf "  %-15s%s\n", $$1, $$2 }' $(MAKEFILE_LIST)


#######################
# Dependency commands
#######################

install: # Install Node.js dependencies for each project (uses npm ci)
	@echo "Projects discovered: $(PROJECT_DIRS)"
	@if [ -z "$(PROJECT_DIRS)" ]; then \
		echo "No projects found to install dependencies for."; exit 1; \
	fi
	@for p in $(PROJECT_DIRS); do \
		echo "\n==> Installing dependencies for $$p"; \
		cd $$p/nodejs && \
		if [ -f package-lock.json ]; then \
			npm ci --no-audit --no-fund; \
		else \
			npm install --no-audit --no-fund; \
		fi || exit $$?; \
	done


update: # Update Node.js dependencies for each project (npm update + prune)
	@echo "Projects discovered: $(PROJECT_DIRS)"
	@if [ -z "$(PROJECT_DIRS)" ]; then \
		echo "No projects found to update dependencies for."; exit 1; \
	fi
	@for p in $(PROJECT_DIRS); do \
		echo "\n==> Updating dependencies for $$p"; \
		cd $$p/nodejs && \
		npm update --no-audit --no-fund && \
		npm prune --no-audit --no-fund || { echo "Update failed for $$p"; exit 1; }; \
	done


######################
# Unit test commands
######################

test: # Run tests (with coverage) for each discovered project. Use PROJ or PROJS to limit.
	@echo "Projects discovered: $(PROJECT_DIRS)"
	@if [ -z "$(PROJECT_DIRS)" ]; then \
		echo "No projects found to test (looked for nodejs/package.json in subfolders)."; exit 1; \
	fi
	@for p in $(PROJECT_DIRS); do \
		echo "\n==> Running tests for $$p"; \
		cd $$p/nodejs && \
		if [ ! -d node_modules ]; then \
			echo "Run 'make install' first!"; \
		fi && \
		NODE_ENV=test npm test -- --coverage --coverageReporters=lcov --coverageReporters=text || exit $$?; \
	done


######################
# Local "deploy" commands
######################

# Use a cli parameter to denote the folder (project) where the code resides.
# Additionally, expect that the local ENV has S3BUCKET set so this command knows
# where to copy the zip file.
PROJ ?= 

deploy-dev: # Zip and copy to S3 bucket
	@if [ -z "$(PROJ)" ]; then \
		echo "No project found to package and deploy"; exit 1; \
	fi
	@echo "Package and Deploy the $(PROJ) application"
	@if [ -d "$(PROJ)/nodejs" ]; then \
		if [ ! -f "$(PROJ)/nodejs/zipmanifest.txt" ]; then \
			echo "No zipmanifest.txt file, exiting!"; exit 1; \
		fi; \
		rm -f "$(PROJ)/$(PROJ).zip"; \
		cd "$(PROJ)/nodejs" && zip -r ../$(PROJ).zip -@ < zipmanifest.txt; \
		aws s3 cp ../$(PROJ).zip s3://$(S3BUCKET)/files/$(PROJ).zip; \
	else \
		echo "No nodejs folder"; \
	fi
