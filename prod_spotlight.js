const DMX = require("./index");
const mqtt = require("mqtt");

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
const testTopic = "silabs/aoa/angle/ble-pd-842E1431C72F";
const testTopic2 = "silabs/aoa/angle/ble-pd-842E1431C72A";
const topicFormat = "silabs/aoa/angle/";
var mqttClient = mqtt.connect(MQTT_URI);

//set up DMX universes
const dmx = new DMX();
const universe = dmx.addUniverse("demo", "artnet", "192.168.4.190", {});

// COMPOSITE OBJECTS
var spotlights = [];
spotlights.push({
    x: 0,
    y: 0,
    height: 4,
    spotlightOffset: "0",
    assignedTag: "842E1431C72F",
    device: universe,
});

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
    console.log("Yaw Angle: " + arcTan)
    return arcTan
}
function calculatePitchAngle(x, y, spotlight) {
    var opposite = Math.abs(spotlight.x - x)
    var adjacent = Math.abs(spotlight.y - y)
    var hypotenuse = Math.sqrt(Math.pow(opposite, 2) + Math.pow(adjacent, 2))
    var arcTan = (Math.atan(hypotenuse / spotlight.height) * (180 / Math.PI))
    console.log("Pitch Angle: " + arcTan)
    return arcTan
}

//MQTT BEHAVIORS
mqttClient.on("connect", () => {
    console.log("connected");
});

mqttClient.on("error", () => {
    console.log("error");
});

mqttClient.subscribe([testTopic, testTopic2], { qos: 2 });

mqttClient.on("message", (topic, message, packet) => {
    var macAddress = topic.substring(24, 36);
    console.log("Target for MAC: " + macAddress);
    var spotlightToMove = findSpotlightAssociatedWith(macAddress);

    if (spotlightToMove) {
        var targetCoordinates = JSON.parse(message.toString());
        console.log(targetCoordinates);

        //inputs
        var targetX = targetCoordinates.x;
        var targetY = targetCoordinates.y;
        var targetZ = targetCoordinates.z;

        //temp vars
        var yaw = 0;
        var pitch = 0;
        var color = COLOR_WHITE;

        if (targetY <= spotlightToMove.y && targetX > spotlightToMove.x) {
            yaw = Math.floor(calculateYawAngle(targetX, targetY, spotlightToMove) / YAW_COEFF)
            pitch = 128 - Math.floor(calculatePitchAngle(targetX, targetY, spotlightToMove) / PITCH_COEFF)
        } else if (targetY > spotlightToMove.y && targetX > spotlightToMove.x) {
            yaw = 43 + (43 - (Math.floor(calculateYawAngle(targetX, targetY, spotlightToMove) / YAW_COEFF)))
            pitch = 128 - Math.floor(calculatePitchAngle(targetX, targetY, spotlightToMove) / PITCH_COEFF)
        } else if (targetY <= spotlightToMove.y && targetX <= spotlightToMove.x) {
            yaw = 43 + (43 - (Math.floor(calculateYawAngle(targetX, targetY, spotlightToMove) / YAW_COEFF)))
            pitch = 128 + Math.floor(calculatePitchAngle(targetX, targetY, spotlightToMove) / PITCH_COEFF)
        } else if (targetY > spotlightToMove.y && targetX <= spotlightToMove.x) {
            yaw = Math.floor(calculateYawAngle(targetX, targetY, spotlightToMove) / YAW_COEFF)
            pitch = 128 + Math.floor(calculatePitchAngle(targetX, targetY, spotlightToMove) / PITCH_COEFF)
        }

        // 90 DEGREE OFFSET CALIBRATION
        if (spotlightToMove.spotlightOffset == "90") {
            yaw += 42;
        } else if (spotlightToMove.spotlightOffset == "180") {
            yaw += 84;
        } else if (spotlightToMove.spotlightOffset == "270") {
            yaw -= 42;
        }

        console.log("VARS... Yaw: " + yaw + " Pitch: " + pitch);
        obj = {
            1: yaw,
            2: 0, //yaw fine tune
            3: pitch,
            4: 0, //pitch fine tune
            5: color,
            6: 0,
            7: 0, //strobe
            8: 10, //req.body.lum
            9: 0,
        };

        if (spotlightToMove.device) {
            spotlightToMove.device.update(obj);
        } else {
            console.log(
                `Cannot find device for command : {Yaw: ${yaw}, Pitch ${pitch}, Color: ${color}}`
            );
        }
    } else {
        console.log("spotlight assigned to " + macAddress + " not found.");
    }
    console.log("--------------");
});
