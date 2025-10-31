SHELL=/bin/bash
DATETIME:=$(shell date -u +%Y%m%dT%H%M%SZ)

.PHONY: help install-all update-all test-all

# Discover Javascript/Node projects: immediate subdirectories that contain 
# a nodejs/package.json
PROJECT_DIRS := $(shell for d in ./*/ ; do if [ -f "$$d/package.json" ]; then echo $${d%/} ; fi ; done)

help: # Preview Makefile commands
	@awk 'BEGIN { FS = ":.*#"; print "Usage:  make <target>\n\nTargets:" } \
		/^[-_[:alpha:]]+:.?*#/ { printf "  %-15s%s\n", $$1, $$2 }' $(MAKEFILE_LIST)


#######################
# Dependency commands (for all projects)
#######################

install-all: # Install dependencies for all projects
	@echo "Projects discovered: $(PROJECT_DIRS)"
	@if [ -z "$(PROJECT_DIRS)" ]; then \
		echo "No projects found to install dependencies for."; exit 1; \
	fi
	@for p in $(PROJECT_DIRS); do \
		echo "==> Installing dependencies for $$p"; \
		$(MAKE) -C $$p install; \
	done


update-all: # Update dependencies for all projects
	@echo "Projects discovered: $(PROJECT_DIRS)"
	@if [ -z "$(PROJECT_DIRS)" ]; then \
		echo "No projects found to update dependencies for."; exit 1; \
	fi
	@for p in $(PROJECT_DIRS); do \
		echo "==> Updating dependencies for $$p"; \
		$(MAKE) -C $$p update; \
	done


######################
# Unit test commands (for all projects)
######################

test-all: # Run tests (with coverage) for each discovered project. Use PROJ or PROJS to limit.
	@echo "Projects discovered: $(PROJECT_DIRS)"
	@if [ -z "$(PROJECT_DIRS)" ]; then \
		echo "No projects found to test (looked for package.json in subfolders)."; exit 1; \
	fi
	@for p in $(PROJECT_DIRS); do \
		echo "==> Running tests for $$p"; \
		$(MAKE) -C $$p test; \
	done
