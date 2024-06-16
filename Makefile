init_services:
	docker-compose -f docker-compose.services.yml up -d
app:
	docker rm -f photoco_server_running; docker-compose -f docker-compose.web.yml -f docker-compose.services.yml run --name photoco_server_running --use-aliases --rm -p 4500:4500 server npm start
bash:
	docker-compose -f docker-compose.web.yml -f docker-compose.services.yml run --rm server bash