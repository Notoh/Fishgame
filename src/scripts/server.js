let server;

function startServer() {
    server = new Peer()

    let gameState = {
        map: 0,
        players: []
    }

    let effects = []

    server.on('open', () => {

        console.log("\n            ______   __     ______     __  __        ______     ______     __    __     ______    \n           /\\  ___\\ /\\ \\   /\\  ___\\   /\\ \\_\\ \\      /\\  ___\\   /\\  __ \\   /\\ \"-./  \\   /\\  ___\\   \n           \\ \\  __\\ \\ \\ \\  \\ \\___  \\  \\ \\  __ \\     \\ \\ \\__ \\  \\ \\  __ \\  \\ \\ \\-./\\ \\  \\ \\  __\\   \n            \\ \\_\\    \\ \\_\\  \\/\\_____\\  \\ \\_\\ \\_\\     \\ \\_____\\  \\ \\_\\ \\_\\  \\ \\_\\ \\ \\_\\  \\ \\_____\\ \n             \\/_/     \\/_/   \\/_____/   \\/_/\\/_/      \\/_____/   \\/_/\\/_/   \\/_/  \\/_/   \\/_____/ \n                                                                                                  \n           ");
        console.log(`Room code: ${server.id}`)
        // alert(`${location.origin}/Fishgame/src/game.html?room=${server.id}&server=0`)

        let connections = {}

        server.on("connection", (conn) => {
            console.log("Added connection " + conn.peer);

            connections[conn.peer] = { heartbeat: 0, connection: conn }

            conn.on('open', () => {
                gameState.players.push({
                    id: conn.peer,
                    x: maps[gameState.map].spawnPoint[0],
                    y: maps[gameState.map].spawnPoint[1],
                    r: 0,
                    vx: 0,
                    vy: 0,
                    vr: 0,
                    health: 3,
                    color: Math.floor(Math.random() * 360),
                    name: ''
                })

                conn.on('data', (data) => {
                    switch (data.type) {
                        case CONN_EVENTS.clientUpdate:
                            effects = [...effects, ...physicsInput(gameState, data.data, conn.peer)]
                            break;
                        case CONN_EVENTS.heartbeat:
                            conn.send({ type: CONN_EVENTS.heartbeatResponse })
                            break;
                        case CONN_EVENTS.heartbeatResponse:
                            connections[conn.peer].heartbeat = 0
                            break;
                        case CONN_EVENTS.nameChange:
                            gameState.players.find(player => player.id === conn.peer).name = data.data
                            break;
                    }
                })

                conn.on('close', () => {
                    console.log("Removing peer")
                    delete connections[conn.peer]
                    gameState.players = gameState.players.filter(player => player.id !== conn.peer)
                })

                conn.send({ type: CONN_EVENTS.clientInit, data: gameState })
            })
        })

        // Update serverside physics
        let lastUpdate = Date.now()
        let deltaTime = 0;
        setInterval(() => {
            deltaTime = Math.round(Date.now() / 16) - Math.round(lastUpdate / 16);
            while (deltaTime > 0) {
                deltaTime -= 1;
                physicsTick(gameState);
                lastUpdate = Date.now()
            }
        }, 1000 / 60) // 60 times per second

        // // Emit server update to client
        setInterval(() => {
            Object.values(connections).forEach(conn => {
                conn.connection.send({ type: CONN_EVENTS.serverUpdate, data: { timeStamp: lastUpdate, state: gameState } });
                if (effects.length > 0)
                    conn.connection.send({ type: CONN_EVENTS.serverEffect, data: effects })
            })
            effects = []
        }, 1000 / 20)

        setInterval(() => {
            Object.values(connections).forEach(conn => {
                conn.connection.send({ type: CONN_EVENTS.heartbeat })
                conn.heartbeat++
                if (conn.heartbeat > 5) {
                    conn.connection.close()
                    delete connections[conn.peer]
                    gameState.players = gameState.players.filter(player => player.id !== conn.peer)
                }
            })
        }, 1000)

        startClient(server.id);
    })
}

if (isServer) {
    startServer();
}
