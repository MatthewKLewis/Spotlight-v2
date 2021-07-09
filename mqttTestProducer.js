var mqtt = require("mqtt");
const MQTT_URI = "mqtt://localhost:1883";
const testTopic0 = "silabs/aoa/position/multilocator-demo/ble-pd-588E81A541B7";
const testTopic1 = "silabs/aoa/angle/ble-pd-842E1431C72A";

var mqttClient = mqtt.connect(MQTT_URI); //no options

mqttClient.on("error", () => {
  console.log("error");
});

var testPattern = [
  { x: 2.68, y: 0.54, z: 0 },
  { x: .76, y: .76, z: 0 },
  { x: .76, y: 4.27, z: 0 },
  { x: 5.03, y: 4.27, z: 0 },
  { x: 5.03, y: 0.76, z: 0 }  
];

index = 0;
setInterval(() => {
    mqttClient.publish(testTopic0, JSON.stringify(testPattern[index]), {}, () => {
      console.log(testTopic0)
      console.log(JSON.stringify(testPattern[index]))
    });
  //run the length, reset when done.
  index++;
  if (index == testPattern.length) {index = 0}
  console.log('-----------------')
}, 3000);
