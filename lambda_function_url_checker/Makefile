SHELL=/bin/bash
DATETIME:=$(shell date -u +%Y%m%dT%H%M%SZ)

.PHONY: help install update clean test zip rm-zip dev-publish

help: # Preview Makefile commands
	@awk 'BEGIN { FS = ":.*#"; print "Usage:  make <target>\n\nTargets:" } \
		/^[-_[:alpha:]]+:.?*#/ { printf "  %-15s%s\n", $$1, $$2 }' $(MAKEFILE_LIST)


#######################
# Dependency commands
#######################

install: # Install Node.js dependencies
	@if [ -f package-lock.json ]; then \
		npm ci --no-audit --no-fund; \
	else \
		npm install --no-audit --no-fund; \
	fi || exit $$?; \

update: # Update Node.js dependencies
	@npm update --no-audit --no-fund && \
	npm prune --no-audit --no-fund || { echo "Update failed for $$p"; exit 1; };

clean: # Clean all npm
	@rm -rf node_modules; \
	rm -rf coverage; \
	rm package-lock.json


######################
# Unit tests
######################

test: # Run tests
	@if [ ! -d node_modules ]; then \
		echo "Run 'make install' first! Exiting..."; exit 1;\
	fi && \
	if [ ! -f "zipmanifest.txt" ]; then \
		echo "No zipmanifest.txt file! Exiting..."; exit 1; \
	fi; \
	if [ ! -f ".runtime" ]; then \
		echo "No .runtime file! Exiting..."; exit 1; \
	fi; \
	NODE_ENV=test npm test -- --coverage --coverageReporters=lcov --coverageReporters=text || exit $$?;


######################
# Local "deploy" commands
######################

# Use a cli parameter to denote the folder (project) where the code resides.
# Additionally, expect that the local ENV has S3BUCKET set so this command knows
# where to copy the zip file.

zip: # Zip application code
	@PROJ=$${PWD##*/}; \
	if [ ! -f "zipmanifest.txt" ]; then \
		echo "No zipmanifest.txt file, exiting!"; exit 1; \
	fi; \
	rm -f $$PROJ.zip; \
	zip -r $$PROJ.zip -@ < zipmanifest.txt; 

dev-publish: zip # Copy ZIP to S3 bucket
	@PROJ=$${PWD##*/}; \
	aws s3 cp $$PROJ.zip s3://$$(aws ssm get-parameter --name "/tfvars/init/shared-files-bucket-id" --query "Parameter.Value" --output text)/files/$$PROJ.zip; \

rm-zip: # remove the ZIP file
	@PROJ=$${PWD##*/}; rm -f $$PROJ.zip
