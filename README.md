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

# общение с сервером

формат сообщений для общения с сервером JSON
структура объекта, который ожидает и отправляет сервер следующая:
```
{
action:'%имя команды%',
payload:
  {<объект с полями зависящими от %имени команды%>}
}
```
если payload командой не подразумевается, то можно его опустить или задать payload:null.

## команды серверу

### вход в комнату 
```
{action: "join", payload: { gameID: gameID }}
```
от сервера прийдет 
```
{action: "newState", payload: { userCondition: "inLobby" }}
```
Позже добавлю, что вместе с этим прилетит второе сообщение с содержимым комнаты (игроки, ID, название комнаты)

### выход из комнаты 
```
{action: "leave", payload: null} или просто {action: "leave"}
```
в ответ сервер пришлет 
```
{action: "newState", payload: { userCondition: "outOfGame" }}
```

## сообщения от сервера

### Изменение "страницы"
Оповещение игрока о том, что он "вышел в главное меню"/"зашел в комнату"/"начал матч"/"перешел на финальный экран"
```
{action: "newState", payload: { userCondition: userCondition }}
```
userCondition может принимать следующие значения:
* 'outOfGame' - главное меню
* 'inLobby' - в лобби, фаза подготовки игры
* 'inGame' - находится в матче
* ('resultScreen' - находится на экране с результатом матча) стоит обсудить
