var mqtt = require("mqtt");
const MQTT_URI = "mqtt://localhost:1883";
const testTopic0 = "silabs/aoa/angle/ble-pd-842E1431C72F";
const testTopic1 = "silabs/aoa/angle/ble-pd-842E1431C72A";

var mqttClient = mqtt.connect(MQTT_URI); //no options

mqttClient.on("error", () => {
  console.log("error");
});

var testPattern = [
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 0, z: 0 },
  { x: 4, y: 4, z: 0 },
  { x: 4, y: 4, z: 0 },
  { x: -4, y: -4, z: 0 },
  { x: -4, y: -4, z: 0 },
  { x: -4, y: 4, z: 0 },
  { x: -4, y: 4, z: 0 },
  { x: 4, y: -4, z: 0 },
  { x: 4, y: -4, z: 0 },
];

index = 0;
setInterval(() => {
  if (index % 2 == 0) {
    mqttClient.publish(testTopic0, JSON.stringify(testPattern[index]), {}, () => {
      console.log("even.");
    });
  } else {
    mqttClient.publish(testTopic1, JSON.stringify(testPattern[index]), {}, () => {
      console.log("odd.");
    });
  }
  //run the length, reset when done.
  index++;
  if (index == testPattern.length) {index = 0}
}, 1000);
