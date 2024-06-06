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

```js
// const serverURL = "ws://localhost:4444"; // для подключения к локальному серверу
const serverURL = "wss://felarn.ru"; // для подключения к online-серверу
const connection = new WebSocket(serverURL);

connection.onopen = () => {  // событие при установке соединения с сервером он должен отправить сообщение: '{"action":"debug","payload":{"message":"You've connected to Hexlet Chess server"}}'
  console.log("WebSocket connection established");
  connection.send("hello"); // отправка сообщения. Сервер должен будет ответить:
// 'Hi from Hexlet Chess
// You shold use {acton: %command name%, payload: {%data object%}} format 
// to communicate with this server'
};

connection.onmessage = (message) => { // слушатель событий, все ответы сервера проходят через него
  console.log(message.data); // в консоль должны будут вывестись ответы на полключение и send("hello")
};
```

# общение с сервером

формат сообщений для общения с сервером JSON
структура объекта, который ожидает и отправляет сервер следующая:
```JSON
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
