let client, serverConnection
let id

let connected = false;

let maps = [
    {
        currentMap: 0,
        colliders: "#$X",
        tilemap: [
            "                ",
            "      0S        ",
            "   ___[]___     ",
            "   ########     ",
            "   $          3E",
            "             _[]",
            "E     ____   ###",
            "]_    ####   $$$",
            "##              ",
            "$$  10    24 *  ",
            "$$__[]____[]_c__",
            "$$##############"
        ],
        spawnPoint: [
            375,
            75
        ],
        width: 16,
        height: 12,
        pixelSize: 6.25,
        tileSize: 50
    }
]

let gameState = {
    map: 0
}

let screenShakeTime = 0;
let graphicsEffects = []

let serverHeartbeat = 0;

function startClient(roomCode) {
    client = new Peer()

    client.on('open', (clientId) => {
        id = clientId
        console.log("Client connecting...")
        let conn = client.connect(roomCode)

        conn.on('open', () => {
            console.log("Client connected")
            new p5(p => { window._p5 = p; p.setup = setupGame})
            serverConnection = conn
            conn.on('data', (data) => {
                switch (data.type) {
                    case CONN_EVENTS.clientInit:
                        gameState = data.data
                        connected = true
                        break;
                    case CONN_EVENTS.serverUpdate:
                        gameState = data.data.state
                        lastUpdate = data.data.timeStamp
                        timeOffset = Date.now() - lastUpdate;
                        break;
                    case CONN_EVENTS.heartbeatResponse:
                        serverHeartbeat = 0
                        break
                    case CONN_EVENTS.heartbeat:
                        conn.send({ type: CONN_EVENTS.heartbeatResponse })
                        break
                    case CONN_EVENTS.serverEffect:
                        graphicsEffects = [...graphicsEffects, ...data.data]
                        break;
                }
            })


            setInterval(() => {
                conn.send({ type: CONN_EVENTS.heartbeat })
                serverHeartbeat++
                if (serverHeartbeat > 5) {
                    conn.close()
                    connected = false
                }
            }, 1000)
        })
    })
}


let timeOffset = 0;
let lastUpdate = Date.now()

function syncedTime() {
    return Date.now() - timeOffset
}

if (!isServer) {
    startClient(roomCode)
}
