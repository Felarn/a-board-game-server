# Hexlet Chess Server

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

# Подключение к серверу

Для подключения к вебсокет-серверу и начала работы с ним достаточно следующего скрипта, исполненного в браузере:

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
Общение происходит путем отправки сообщений на сервер и ожидания сообщений от сервера\
Сообщения от сервера могут приходить как в ответ на запрос клиента, так и по инициативе сервера без запроса.\
Например когда в ходе партии опонент закончит свой ход - сервер пришлет клиенту сообдение с информацией о новом состоянии доски.\
\
Формат сообщений для общения с сервером - JSON.\
Структура объекта, который ожидает и отправляет сервер следующая:
```js
{
action:'%имя команды%',
payload:
  {<объект с полями зависящими от %имени команды%>}
}
```
если payload командой не подразумевается, то можно его опустить или задать payload:null.

## Команды серверу

### Идентификация и регистрация
Для того, чтобы начать полноценое общение с сервером необходимо каждое новое подключение идентифицировать.
Если клиент подключается к серверу впервые - необходимо отправить команду:
```js
{action:"registration"}
либо
{action:"registration",payload:{userName:"%имя пользователя%"}}
```
ответ сервера содержит ID клиента, который следует использовать в дальнейшем при подключении к серверу:
```js
{action:"registered",payload:{userID:"63c8e399-7314-46ce-bdbb-f4244d9cd99d"}}
```
При повторном подключении используется
``` js
{action:"identification",payload:{userID:"63c8e399-7314-46ce-bdbb-f4244d9cd99d"}}
```
ответ если такой пользователь существует содержит:\
* имя пользователя
* состояние пользователя
+ другие поля будут добавлены при необходимости, и будут включать, в том числе и всю информацию о текущей игре
```js
{action:"identified",payload:{userName:"Anon",userCondition:"outOfGame"}}
```
если пользователь с таким ID не найден, то сервер произведет регистрацию нового пользователя и ответит той же структурой, что и при регистрации
```js
{action:"registered",payload:{userID:"4347cfb0-d952-45c5-ab09-186c0a7a64c2"}}
```
сразу послле подтверждения идентификации или регистрации также придет сообщение со списком открытых комнат
```js
action: roomsList
payload: {"list":[
  {"gameID":"1afb5484-26ee-4f45-9ab7-2933173f5e5d","gameName":"Название комнаты","hostName":"Имя хоста","playerCount":2}
  ....
]}
```


### Чат
возможна отправка сообщений при состоянии игрока "inLobby" и "inGame"
```js
{"action":"chat",
"payload":{"message":"текст сообщения"}}
```

все участники текущей игры получают сообщение
```js
{action:"chat",
payload:{message:"текст сообщения",from:"%имя отправителя%"}}
```

### Создание новой комнаты 
```
{action: "createGame",
payload: { gameName: 'название комнаты' }}
```

в ответ придет 4 сообщения:
изменение состояния пользователя на "в лобби"
```js
action: newUserCondition
payload: {"userCondition":"inLobby"}
```
оповещение в чат, от сервера, о том, что игрок подключился к лобби
```js
{action:"chat",
payload:{
  message:"Вы присоединилсь к комнате \"название комнаты\",
  ID: (1afb5484-26ee-4f45-9ab7-2933173f5e5d)\"",
  from:"Server"
}}
```
сторона, выбранная в данный момент пользователем, по умолчанию "spectator"
```js
action: yourSide
payload: {"side":"spectator"}
```
информация о комнате:
```js
action: playerList
payload: {"playerList":[
  {"userName":"Имя игрока 1;","side":"spectator","connectionStatus":"online"},
  {"userName":"Имя игрока 2;","side":"spectator","connectionStatus":"online"},
  ...
  {"userName":"Имя игрока n;","side":"spectator","connectionStatus":"online"},
  ],
"whitePlayerName":"",  // имя игрока, выбравшего в данный момент белых
"blackPlayerName":"",  // имя игрока, выбравшего в данный момент черных
"gameName":"название коматы",
"gameID":"1afb5484-26ee-4f45-9ab7-2933173f5e5d", // ID комнаты, необходимый для подключения
"isPrivate":true      // флаг, true = "закрытая игра", false = "открытая игра" 
}
```
Блок с информацией о комнате будет приходить снова при изменении любого из этих свойств.

### Подключение к комнате 
```js
{action:"join", payload: { gameID: UUID}}
```
ответ от сервера идентичен тому, что приходит при создании комнаты

### Выход из комнаты 
```js
{action: "leave", payload: null} или просто {action: "leave"}
```
в ответ сервер пришлет 
```js
{action: "newUserCondition", payload: { userCondition: "outOfGame" }}
```
а также спискок открытых комнат "roomsList"

### выбор стороны
```
action: "pickSide", payload: { side: 'строка black/white/spectator' }
```
в ответ придут описнные выше события yourSide и playerList

### Переименование
доступно в состоянии игрока 'outOFGame' и 'inLobby'
```js
{action:"rename",payload:{userName:"%новое имя%"}}
```
в случае 'outOfGame' ответа от сервера не предполагается
в случае 'inGame' сервер оповестит всех игроков в комнате, разослав новый список имен playerList

### Переименование комнаты
```js
{action:"renameGame",
paylpad: { newGameName: строка }}
```
ответ - событие playerList

### Переключение открытой/закрытой игры
```js
{action: "switcGamePrivacy", 
paylpad: { isPrivate: true/false }}
```


### завершить ход:
```js
{action:"makeTurn",
paylpad: { формат сохранения доски, узнать актуальный формат}}
```
2 ответа:\ 
актуальное состояние доски:
```js
action: gameState
payload: {формат сохранения доски}
```
и информация о ходящих сторонах
```js
action: turnState
payload: {"activePlayer":"имя игрока делающего ход",
"activeSide":"цвет игрока делающего ход white/black",
"isYourTurn":false} // "я ли делаю ход сейчас"
```

### начало матча:
```js
{action:"startMatch"
paylpad: { начальная позиция в том же формате, что и сохранение доски}}
```
3 ответа:
все находящиеся в комнате получают оповещение о изменении состояния
```js
action: newUserCondition
payload: {"userCondition":"inGame"}
```
еще два сообщения аналогичны завершению хода: turnState и gameState


### Завершить игру
команда необходима в основном для того чтобы игра объявила победителя, но также пондаобится для того чтобы сдаться/cогласиться на ничью/ объявить победу если соперник отключился
```js
{action: "finishGame", 
paylpad: { result: "win/loss/draw",
reason: "причина завершения матча, нужно согласовывать" }}
```
в ответ придет сообщение
```js
сообщение с результатами матча, примеры победы, поражения, ничьей
action: gameEnded
payload: {"result":"youWon",  // победа
"winnerName":"имя победителя"
,"looserName":"имя проигравшего",
"reason":"что привело к такому исходу? сдача/мат/дисконект"}

action: gameEnded            // поражение
payload: {"result":"youLoose",
"winnerName":"имя победителя",
"looserName":"имя проигравшего",
"reason":"что привело к такому исходу? сдача/мат/дисконект"}

action: gameEnded          //ничья
payload: {"result":"draw",
"winnerName":null,
"looserName":null,
"reason":"что привело к такому исходу? договорились/пат/дисконект"}
```


### предложить сопернику ничью:
```js
{action:"proposeDraw",
paylpad: null }
```
другой игрок получит сообщение предлагающее ему ничью
```
action: "drawProposal"
payload: null
```



## сообщения от сервера

### отключение одного из игроков
```js
в случае потери соединения одним из активных игроков (белым или черным) оставшемуся игроку через некоторое время предложат объявит победу
action: winProposal
payload: {"ableToDeclareWin":true}
```
но в случае возвращения соперника онлайн это предложение будет отозвано следующим сообщением
```js
отзыв возможности объявить победу, в случае если игрок реконнектился:
action: winProposal
payload: {"ableToDeclareWin":false}
```

### Изменение "страницы"
Оповещение игрока о том, что он "вышел в главное меню"/"зашел в комнату"/"начал матч"/"перешел на финальный экран"
```js
{action: "newUserCondition", payload: { userCondition: userCondition }}
```
userCondition может принимать следующие значения:
* 'outOfGame' - главное меню
* 'inLobby' - в лобби, фаза подготовки игры
* 'inGame' - находится в матче
* 'onResultScreen' - находится на экране с результатом матча

### сообщения для дебага
```js
{action:"debug",payload:{message:"You've connected to Hexlet Chess server"}}
```
