var mqtt = require("mqtt");
const MQTT_URI = "mqtt://localhost:1883";
const testTopic0 = "silabs/aoa/position/multilocator-demo/ble-pd-AAAAAAAAAAAA";
const testTopic1 = "silabs/aoa/position/multilocator-demo/ble-pd-BBBBBBBBBBBB";

var mqttClient = mqtt.connect(MQTT_URI); //no options

mqttClient.on("error", () => {
  console.log("error");
});

var testPattern = [
  // { x: 2.68, y: 0.54, z: 0 },
  // { x: 2.68, y: 4.27, z: 0 },
  // { x: .76, y: .76, z: 0 },
  // { x: .76, y: 1.76, z: 0 },
  // { x: .76, y: 4.27, z: 0 },
  { x: 5.03, y: 4.27, z: 0 },
  { x: 5.03, y: 1.76, z: 0 },
  { x: 5.03, y: 0.76, z: 0 } 
];

index = 0;
setInterval(() => {
    // mqttClient.publish(testTopic0, JSON.stringify(testPattern[index]), {}, () => {
    //   console.log(testTopic0)
    //   console.log(JSON.stringify(testPattern[index]))
    // });
    mqttClient.publish(testTopic1, JSON.stringify(testPattern[index]), {}, () => {
      console.log(testTopic1)
      console.log(JSON.stringify(testPattern[index]))
    });
  //run the length, reset when done.
  index++;
  if (index == testPattern.length) {index = 0}
  console.log('-----------------')
}, 5000);
