const express = require('express');
const cors = require('cors');
var mqtt = require("mqtt");

const MQTT_URI = "mqtt://localhost:1883";
const testTopic0 = "silabs/aoa/position/multilocator-demo/ble-pd-AAAAAAAAAAAA";
const testTopic1 = "silabs/aoa/position/multilocator-demo/ble-pd-BBBBBBBBBBBB";

//set up express and mqtt
const app = express();
const port = process.env.PORT || 5000
var mqttClient = mqtt.connect(MQTT_URI); //no options

//assign middleware
app.use(cors());
app.use(express.json());

// app.route('/api/move/:id').post((req, res) => {
//   var spotId = req.params.id
//   var testPattern = req.body
//   console.log(spotId)
//   console.log(testPattern)
//   mqttClient.publish(testTopic0, JSON.stringify(testPattern), {}, () => {
//     console.log('sent');
//   });
//   mqttClient.publish(testTopic1, JSON.stringify(testPattern), {}, () => {
//     console.log('sent');
//   });
//   res.json({message: 'ok'})
// });
mqttClient.on("connect", () => {
  console.log("connected");
});
mqttClient.on("error", () => {
  console.log("error");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}.`)
});


// OLD
var testPattern0 = [
  { x: 2.76, y: 2.76, z: 0 }, //room center
  { x: 0.76, y: 0.76, z: 0 }, //left above
  // { x: 1.4, y: 0.76, z: 0 }, //leftish above
  // { x: 2.6, y: 0.76, z: 0 }, //center above
  // { x: 2.6, y: 0.2, z: 0 }, //center above far
  // { x: 2.6, y: 1, z: 0 }, //center above close
  // { x: 2.6, y: 0.76, z: 0 }, //center above
  // { x: 3.8, y: 0.76, z: 0 }, //rightish above
  // { x: 5.03, y: 0.76, z: 0 } //right above
];

var testPattern1 = [
  { x: 2.76, y: 2.76, z: 0 }, //room center
  { x: 0.76, y: 4.27, z: 0 }, //left below
  // { x: 1.4, y: 4.27, z: 0 }, //leftish below
  // { x: 2.6, y: 4.27, z: 0 }, //center below
  // { x: 2.6, y: 6, z: 0 }, //center below far
  // { x: 2.6, y: 3.8, z: 0 }, //center below close
  // { x: 2.6, y: 4.27, z: 0 }, //center below
  // { x: 3.8, y: 4.27, z: 0 }, //rightish below
  // { x: 5.03, y: 4.27, z: 0 }, //right below
];
index = 0;
setInterval(() => {
    mqttClient.publish(testTopic0, JSON.stringify(testPattern0[index]), {}, () => {
      console.log(testPattern0[index])
    });
    mqttClient.publish(testTopic1, JSON.stringify(testPattern0[index]), {}, () => {
      console.log(testPattern0[index])
    });
  index++;
  if (index == testPattern0.length) {index = 0}
  console.log('-----------------')
}, 4000);
