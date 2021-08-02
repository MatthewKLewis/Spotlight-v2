const DMX = require("./index");
const mqtt = require("mqtt");
const spotlightConfig = require("./spotlightConfig.json");
const dmxDeviceConfig = require("./dmxDeviceConfig.json");
const sophiaConfig = require("./sophiaConfig.json")

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
const testTopic0 =
  "silabs/aoa/position/multilocator-demo/ble-pd-" +
  spotlightConfig[0].assignedTag;
const testTopic1 =
  "silabs/aoa/position/multilocator-demo/ble-pd-" +
  spotlightConfig[1].assignedTag;
const XPERT_MESSAGE_TOPIC = "xpertmessagetopic";
var mqttClient = mqtt.connect(MQTT_URI);

//set up DMX universes
const dmx = new DMX();
var universes = [];
dmxDeviceConfig.forEach((device) => {
  universes.push(dmx.addUniverse(device.name, device.driver, device.deviceId));
});
var spotlights = spotlightConfig;
for (let i = 0; i < spotlightConfig.length; i++) {
  spotlights[i].device = universes[i];
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
  var opposite = Math.abs(spotlight.x - x);
  var adjacent = Math.abs(spotlight.y - y);
  var arcTan = Math.atan(opposite / adjacent || 0) * (180 / Math.PI);
  arcTan = arcTan / YAW_COEFF;
  //console.log("Yaw = " + arcTan)
  return arcTan;
}
function calculatePitchAngle(x, y, spotlight) {
  var opposite = Math.abs(spotlight.x - x);
  var adjacent = Math.abs(spotlight.y - y);
  var hypotenuse = Math.sqrt(Math.pow(opposite, 2) + Math.pow(adjacent, 2));
  var arcTan = Math.atan(hypotenuse / spotlight.height) * (180 / Math.PI);
  arcTan = arcTan / PITCH_COEFF;
  //console.log("Pitch = " + arcTan)
  return arcTan;
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

    if (spotlightToMove.spotlightOffset == "0") {
      if (targetY <= spotlightToMove.y && targetX <= spotlightToMove.x) {
        //SPOTLIGHT 0
        //console.log("topic " + macAddress + " position above spot, left of spot")
        color = COLOR_ORANGE;
        yaw =
          86 +
          (43 -
            Math.floor(calculateYawAngle(targetX, targetY, spotlightToMove)));
        pitch =
          128 -
          Math.floor(calculatePitchAngle(targetX, targetY, spotlightToMove));
      } else if (targetY <= spotlightToMove.y && targetX > spotlightToMove.x) {
        //SPOTLIGHT 0
        //console.log("topic " + macAddress + " position above spot, right of spot")
        color = COLOR_BLUE;
        yaw =
          129 +
          Math.floor(calculateYawAngle(targetX, targetY, spotlightToMove));
        pitch =
          128 -
          Math.floor(calculatePitchAngle(targetX, targetY, spotlightToMove));
      }
      //SWITCH
      else if (targetY > spotlightToMove.y && targetX <= spotlightToMove.x) {
        //SPOTLIGHT 1
        //console.log("topic " + macAddress + " position below spot, left of spot")
        color = COLOR_BLUE;
        yaw =
          43 + Math.floor(calculateYawAngle(targetX, targetY, spotlightToMove));
        pitch =
          128 -
          Math.floor(calculatePitchAngle(targetX, targetY, spotlightToMove));
      } else if (targetY > spotlightToMove.y && targetX > spotlightToMove.x) {
        //SPOTLIGHT 1
        //console.log("topic " + macAddress + " position below spot, right of spot")
        color = COLOR_ORANGE;
        yaw =
          43 - Math.floor(calculateYawAngle(targetX, targetY, spotlightToMove));
        pitch =
          128 -
          Math.floor(calculatePitchAngle(targetX, targetY, spotlightToMove));
      } else {
        console.log("ERROR!");
      }
    }

    color = COLOR_WHITE;

    obj = {
      1: yaw,
      2: 0, //yaw fine tune
      3: pitch,
      4: 0, //pitch fine tune
      5: color,
      6: 0,
      7: 9, //strobe
      8: 60, //req.body.lum
      9: 0,
    };

    if (spotlightToMove.device) {
      spotlightToMove.device.update(obj);
    } else {
      console.log(
        `Cannot find device for command : {Yaw: ${yaw}, Pitch ${pitch}, Color: ${color}}`
      );
    }

    //Send an XpertMessage to an MQTT Topic
    // var xpertMessage = {
    //   DataBusReports: [],
    //   DataCorrelations: [],
    //   DeviceReports: [
    //     {
    //       Attributes: [],
    //       AUTOID_EPC: "MAC_" + spotlightToMove.assignedTag, //
    //       DataTimestamp: "1970-01-01T00:00:00",
    //       DeviceActionBit: true,
    //       DeviceModel: "E44",
    //       DeviceSerialNumber: spotlightToMove.assignedTag, //
    //       DeviceType: "RFID_ACTIVE_802_11",
    //       DeviceUniqueID: spotlightToMove.assignedTag, //
    //       DeviceUniqueID_DisplayName: "MAC",
    //       Events: [],
    //       Item: {
    //         ItemId: 9267,
    //         DateCreated: "1970-01-01T00:00:00",
    //         DateUpdated: "1970-01-01T00:00:00",
    //       },
    //       LastEvent: {},
    //       LastEventIndex: -1,
    //       LOCMessageContent: "C4:CB:6B:50:06:60:-20",
    //       MessageId: "0",
    //       MessageType: "RTLS_RFID_ACTIVE_802_11",
    //       ReceivedTimestamp: Date.now().toString(),
    //       RFID: {
    //         EPC: spotlightToMove.assignedTag,
    //         IsValid: true,
    //         ReadCount: 2,
    //         Readers: [
    //           {
    //             AntennaDisplayName: "DIETRICK OFFICE ",
    //             AntennaID: 4265,
    //             FirstDetectedTimestamp: "2021-04-26T18:44:55.0920401Z",
    //             HopTableValue: 1,
    //             IsDefaultLocation: true,
    //             LastDetectedTimestamp: "2021-04-26T18:44:55.0920401Z",
    //             MaxTransmitPower: 70,
    //             MinReceiveSensitivity: 40,
    //             ReadCount: 1,
    //             ReaderDisplayName: "DIETRICK OFFICE ",
    //             ReaderID: 4265,
    //             RSSI: 20,
    //             RSSI_dbm: -20,
    //             RTLSModelID: 3153,
    //             RTLSModelMapID: 3366,
    //             X: targetCoordinates.X, //
    //             Y: targetCoordinates.Y, //
    //           },
    //         ],
    //         Timestamp: "2021-04-26T18:44:55.0920401Z",
    //       },
    //       RTLSAddress: {},
    //       RTLSContact: {},
    //       RTLSGeo: {},
    //       RTLSGPS: {},
    //       RTLSModel2D: {
    //         IsValid: true,
    //         PosDisplayName: "HIMSS Convention Booth",
    //         PosMapID: 9999,
    //         PosModelID: 9999,
    //         PosZoneIDs: "[]",
    //         Timestamp: "2021-04-26T18:44:55.0920401Z",
    //       },
    //       Sensor: {},
    //       SequenceNumber: 36,
    //       Status: {
    //         BatteryLevel1: 100.0,
    //         Data2: "TkE=",
    //         DeviceReportReason: 12,
    //         IsValid: true,
    //         Timestamp: "2021-04-26T18:44:55.0295018Z",
    //       },
    //       DateCreated: "1970-01-01T00:00:00",
    //       DateUpdated: "1970-01-01T00:00:00",
    //     },
    //   ],
    //   ItemInfo: {
    //     DateCreated: "1970-01-01T00:00:00",
    //     DateUpdated: "1970-01-01T00:00:00",
    //   },
    //   ProximityReports: [],
    //   ReceivedTimestamp: "2021-04-26T18:44:55.0295018Z",
    //   SchemaName: "XpertSchema.XpertMessage.XpertMessage",
    //   SchemaVersion: "1",
    // };
    // mqttClient.publish(
    //   XPERT_MESSAGE_TOPIC,
    //   JSON.stringify(xpertMessage),
    //   {},
    //   () => {
    //     console.log("sent message to " + XPERT_MESSAGE_TOPIC);
    //   }
    // );
  } else {
    console.log("spotlight assigned to " + macAddress + " not found.");
  }
});
