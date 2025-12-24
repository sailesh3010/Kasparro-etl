.PHONY: up down test build

up:
	docker-compose up --build -d

down:
	docker-compose down -v

test:
	npm run test

build:
	npm run build
