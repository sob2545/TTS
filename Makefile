.PHONY: up down fclean re

up:
	docker-compose up --build

no-cache:
	docker-compose build --no-cache nextjs

down:
	docker-compose down

fclean: down
	docker system prune -af
	docker volume prune -f

re: fclean ; make up

# 무한 순환을 방지하기 위한 가드
ifeq ($(filter re,$(MAKECMDGOALS)),re)
.NOTPARALLEL: re
endif