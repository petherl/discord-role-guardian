# Discord Role Guardian Bot - Makefile
# Author: nayandas69
# Description: Automation for bot setup and execution

.PHONY: help install start dev clean setup run docker-build docker-run docker-stop docker-logs docker-clean docker-push

# Default target - shows help
help:
	@echo "\033[1;36m=== Discord Role Guardian Bot - Available Commands ===\033[0m"
	@echo ""
	@echo "\033[1;33m--- Local Development ---\033[0m"
	@echo "\033[1;32mmake setup\033[0m        - Install dependencies and prepare bot"
	@echo "\033[1;32mmake run\033[0m          - Install dependencies and start bot (one command)"
	@echo "\033[1;32mmake install\033[0m      - Install npm dependencies only"
	@echo "\033[1;32mmake start\033[0m        - Start the bot (production mode)"
	@echo "\033[1;32mmake dev\033[0m          - Start the bot (development mode with auto-restart)"
	@echo "\033[1;32mmake clean\033[0m        - Remove node_modules and package-lock.json"
	@echo ""
	@echo "\033[1;33m--- Docker Commands ---\033[0m"
	@echo "\033[1;32mmake docker-build\033[0m - Build Docker image locally"
	@echo "\033[1;32mmake docker-run\033[0m   - Run bot using docker-compose"
	@echo "\033[1;32mmake docker-stop\033[0m  - Stop Docker containers"
	@echo "\033[1;32mmake docker-logs\033[0m  - View Docker container logs"
	@echo "\033[1;32mmake docker-clean\033[0m - Remove Docker containers and images"
	@echo "\033[1;32mmake docker-push\033[0m  - Push Docker image to GitHub Container Registry"
	@echo ""
	@echo "\033[1;33mQuick Start (Local): make run\033[0m"
	@echo "\033[1;33mQuick Start (Docker): make docker-run\033[0m"
	@echo ""

# Install all dependencies
install:
	@echo "\033[1;36m[INSTALLING] Installing npm dependencies...\033[0m"
	npm install
	@echo "\033[1;32m[SUCCESS] Dependencies installed successfully!\033[0m"

# Start the bot in production mode
start:
	@echo "\033[1;36m[STARTING] Launching Discord Role Guardian Bot...\033[0m"
	npm start

# Start the bot in development mode with auto-restart
dev:
	@echo "\033[1;36m[DEV MODE] Starting bot with auto-restart...\033[0m"
	npm run dev

# Setup: Install dependencies
setup: install
	@echo "\033[1;32m[SUCCESS] Bot setup complete!\033[0m"
	@echo "\033[1;33m[INFO] Don't forget to configure your .env file before starting!\033[0m"

# Run: Install and start in one command
run: install
	@echo "\033[1;36m[LAUNCHING] Starting bot...\033[0m"
	npm start

# Clean: Remove installed dependencies
clean:
	@echo "\033[1;33m[CLEANING] Removing node_modules and lock files...\033[0m"
	rm -rf node_modules package-lock.json
	@echo "\033[1;32m[SUCCESS] Cleanup complete!\033[0m"

# Docker: Build image locally
docker-build:
	@echo "\033[1;36m[DOCKER] Building Docker image...\033[0m"
	docker build -t discord-role-guardian:latest .
	@echo "\033[1;32m[SUCCESS] Docker image built successfully!\033[0m"

# Docker: Run using docker-compose
docker-run:
	@echo "\033[1;36m[DOCKER] Starting bot with docker-compose...\033[0m"
	@if [ ! -f .env ]; then \
		echo "\033[1;31m[ERROR] .env file not found! Copy .env.example to .env and configure it.\033[0m"; \
		exit 1; \
	fi
	docker-compose up -d
	@echo "\033[1;32m[SUCCESS] Bot is running in Docker!\033[0m"
	@echo "\033[1;33m[INFO] Use 'make docker-logs' to view logs\033[0m"

# Docker: Stop containers
docker-stop:
	@echo "\033[1;36m[DOCKER] Stopping containers...\033[0m"
	docker-compose down
	@echo "\033[1;32m[SUCCESS] Containers stopped!\033[0m"

# Docker: View logs
docker-logs:
	@echo "\033[1;36m[DOCKER] Viewing bot logs (Ctrl+C to exit)...\033[0m"
	docker-compose logs -f

# Docker: Clean containers and images
docker-clean:
	@echo "\033[1;33m[DOCKER] Removing containers, images, and volumes...\033[0m"
	docker-compose down -v
	docker rmi discord-role-guardian:latest 2>/dev/null || true
	@echo "\033[1;32m[SUCCESS] Docker cleanup complete!\033[0m"

# Docker: Push to GitHub Container Registry (requires login)
docker-push:
	@echo "\033[1;36m[DOCKER] Pushing image to GitHub Container Registry...\033[0m"
	@echo "\033[1;33m[INFO] Make sure you're logged in: docker login ghcr.io\033[0m"
	docker tag discord-role-guardian:latest ghcr.io/nayandas69/discord-role-guardian:latest
	docker push ghcr.io/nayandas69/discord-role-guardian:latest
	@echo "\033[1;32m[SUCCESS] Image pushed successfully!\033[0m"
