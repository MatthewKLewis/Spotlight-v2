const DMX = require("./index");
const mqtt = require("mqtt");
const spotlightConfig = require('./spotlightConfig.json')
const dmxDeviceConfig = require('./dmxDeviceConfig.json')

//DMX Constants and Colors
const YAW_COEFF = 2.117;
const PITCH_COEFF = 0.705;
const COLOR_RED = 10;
const COLOR_WHITE = 0;
const COLOR_BLUE = 30;
const COLOR_CYAN = 70;
const COLOR_GREEN = 40;
const COLOR_ORANGE = 50;
const COLOR_PURPLE = 60;
const COLOR_YELLOW = 20;

//set up mqtt subscriber
const MQTT_URI = "mqtt://localhost:1883";
const topicFormat = "silabs/aoa/angle/";
const testTopic0 = "silabs/aoa/position/multilocator-demo/ble-pd-" + spotlightConfig[0].assignedTag;
const testTopic1 = "silabs/aoa/position/multilocator-demo/ble-pd-" + spotlightConfig[1].assignedTag;
var mqttClient = mqtt.connect(MQTT_URI);

//set up DMX universes
const dmx = new DMX();
var universes = []
dmxDeviceConfig.forEach((device)=>{
    universes.push(dmx.addUniverse(device.name, device.driver, device.deviceId))
})
var spotlights = spotlightConfig;
for (let i = 0; i < spotlightConfig.length; i++) {
    spotlights[i].device = universes[i]
}
//console.log(spotlights)

// TRIGONOMETRY
function findSpotlightAssociatedWith(mac) {
    for (let i = 0; i < spotlights.length; i++) {
        if (mac == spotlights[i].assignedTag) {
            return spotlights[i];
        }
        if (i == spotlights.length - 1) {
            return null;
        }
    }
}
function calculateYawAngle(x, y, spotlight) {
    var opposite = Math.abs(spotlight.x - x)
    var adjacent = Math.abs(spotlight.y - y)
    var arcTan = (Math.atan(opposite / adjacent || 0) * (180 / Math.PI))
    arcTan =  arcTan / YAW_COEFF
    //console.log("Yaw = " + arcTan)
    return arcTan
}
function calculatePitchAngle(x, y, spotlight) {
    var opposite = Math.abs(spotlight.x - x)
    var adjacent = Math.abs(spotlight.y - y)
    var hypotenuse = Math.sqrt(Math.pow(opposite, 2) + Math.pow(adjacent, 2))
    var arcTan = (Math.atan(hypotenuse / spotlight.height) * (180 / Math.PI))
    arcTan =  arcTan / PITCH_COEFF
    //console.log("Pitch = " + arcTan)
    return arcTan
}

//MQTT BEHAVIORS
mqttClient.on("connect", () => {
    console.log("connected");
});
mqttClient.on("error", () => {
    console.log("error");
});
mqttClient.subscribe([testTopic0, testTopic1], { qos: 2 });
mqttClient.on("message", (topic, message, packet) => {
    var macAddress = topic.substring(45, 57);
    var spotlightToMove = findSpotlightAssociatedWith(macAddress);
    if (spotlightToMove) {
        var targetCoordinates = JSON.parse(message.toString());
        //console.log(targetCoordinates)

        //inputs
        var targetX = targetCoordinates.x;
        var targetY = targetCoordinates.y;

        //temp vars
        var yaw = 0;
        var pitch = 0;
        var color = COLOR_WHITE;

        if (spotlightToMove.spotlightOffset == '0') {
            if (targetY <= spotlightToMove.y && targetX <= spotlightToMove.x) { //SPOTLIGHT 0
                //console.log("topic " + macAddress + " position above spot, left of spot")
                color = COLOR_ORANGE
                yaw = 86 + (43 - Math.floor(calculateYawAngle(targetX, targetY, spotlightToMove)))
                pitch = 128 - Math.floor(calculatePitchAngle(targetX, targetY, spotlightToMove))
            } else if (targetY <= spotlightToMove.y && targetX > spotlightToMove.x) { //SPOTLIGHT 0
                //console.log("topic " + macAddress + " position above spot, right of spot")
                color = COLOR_BLUE
                yaw = 129 + Math.floor(calculateYawAngle(targetX, targetY, spotlightToMove))
                pitch = 128 - Math.floor(calculatePitchAngle(targetX, targetY, spotlightToMove))
            } 
            //SWITCH
            else if (targetY > spotlightToMove.y && targetX <= spotlightToMove.x) { //SPOTLIGHT 1
                //console.log("topic " + macAddress + " position below spot, left of spot")
                color = COLOR_BLUE
                yaw = 43 + Math.floor(calculateYawAngle(targetX, targetY, spotlightToMove))
                pitch = 128 - Math.floor(calculatePitchAngle(targetX, targetY, spotlightToMove))
            } else if (targetY > spotlightToMove.y && targetX > spotlightToMove.x) { //SPOTLIGHT 1
                //console.log("topic " + macAddress + " position below spot, right of spot")
                color = COLOR_ORANGE
                yaw =  43 - Math.floor(calculateYawAngle(targetX, targetY, spotlightToMove))
                pitch = 128 - Math.floor(calculatePitchAngle(targetX, targetY, spotlightToMove))
            } else {
                console.log("ERROR!")
            }
        }

        obj = {
            1: yaw,
            2: 0, //yaw fine tune
            3: pitch,
            4: 0, //pitch fine tune
            5: color,
            6: 0,
            7: 0, //strobe
            8: 30, //req.body.lum
            9: 0,
        };

        if (spotlightToMove.device) {
            spotlightToMove.device.update(obj);
        } else {
            console.log(`Cannot find device for command : {Yaw: ${yaw}, Pitch ${pitch}, Color: ${color}}`);
        }
    } else {
        console.log("spotlight assigned to " + macAddress + " not found.");
    }
});
