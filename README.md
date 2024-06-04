# a-board-game-server

Серверная часть работы на летнюю практику Hexlet колледжа

# установка и запуск

Скопировать репозиторий

```
git clone https://github.com/Felarn/a-board-game-server.git
```

для локального запуска:

```
make dev-install
make dev-start
```

сервер запустится через nodemon и будет слушать порт 4444. Порт можно изменить в сгенерированном файле c настройками <em>developement.config</em>

для развертывания на сервере:

```
make deploy
make start
```

сервер будет слушать порт 80

# пдоключение к серверу

Для подключения к вебсокету из скрипта, запущенного в браузере достаточно следующего кода

```
const serverURL = "ws://localhost:4444";
// const serverURL = "ws://felarn.ru";
const connection = new WebSocket(serverURL);

connection.onopen = () => {
  console.log("WebSocket connection established");
  connection.send("hello");
};

connection.onmessage = (message) => {
  console.log(message.data);
};
```
