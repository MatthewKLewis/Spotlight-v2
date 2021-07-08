var mqtt = require("mqtt");
const MQTT_URI = "mqtt://localhost:1883";
const testTopic = "silabs/aoa/angle/ble-pd-842E1431C72F";
const testTopic2 = "silabs/aoa/angle/ble-pd-842E1431C72A";

var mqttClient = mqtt.connect(MQTT_URI); //no options

mqttClient.on("error", () => {
  console.log("error");
});

var testPattern = [
  { x: 0, y: 0, z: 0 },
  { x: 4, y: 4, z: 0 },
  { x: -4, y: -4, z: 0 },
  { x: -4, y: 4, z: 0 },
  { x: 4, y: -4, z: 0 },

];

index = 0;
setInterval(() => {
    mqttClient.publish(testTopic, JSON.stringify(testPattern[index]), {}, () => {
        console.log("sent.");
    });
    index++;
    if (index == testPattern.length) {index = 0}
}, 4000);
