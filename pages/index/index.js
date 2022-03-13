var mqtt = require('../../utils/mqtt.min.js') //根据自己存放的路径修改
const crypto = require('../../utils/hex_hmac_sha1.js'); //根据自己存放的路径修改
var client;
Page({
  data: {
    dat1: "",
  },
  onLoad: function () {
    //注意：这里在程序运行后会直接进行连接，如果你要真机调试，记得关掉模拟器或者使用一个按钮来控制连接，以避免模拟器和真机同时进行连接导致两边都频繁断线重连！
    this.doConnect()
  },
  doConnect() {
    const deviceConfig = {
      productKey: "gwuiXktKj08",
      deviceName: "Y5TxmnLnuZGOiYQ8qHMI",
      deviceSecret: "b6c597ba2f2d3ed5e99f8f5066da3f15",
      regionId: "cn-shanghai" //根据自己的区域替换
    };
    const options = this.initMqttOptions(deviceConfig);
    console.log(options)
    //替换productKey为你自己的产品的（注意这里是wxs，不是wss，否则你可能会碰到ws不是构造函数的错误）
    client = mqtt.connect('wxs://gwuiXktKj08.iot-as-mqtt.cn-shanghai.aliyuncs.com', options)
    client.on('connect', function () {
      console.log('连接服务器成功')
      //注意：订阅主题，替换productKey和deviceName(这里的主题可能会不一样，具体请查看控制台-产品详情-Topic 类列表下的可订阅主题)，并且确保改主题的权限设置为可订阅
      client.subscribe('/gwuiXktKj08/Y5TxmnLnuZGOiYQ8qHMI/user/get', function (err) {
        if (!err) {
          console.log('订阅成功！');
        }
      })

    })
    //接收消息监听
    var that = this;
    client.on('message', function (topic, message) {
      // message is Buffer
      let msg = message.toString();
      console.log('收到消息：' + msg);
      //关闭连接 client.end()
      that.setData({
        dat1: msg,
      })
    })
  },
  //IoT平台mqtt连接参数初始化
  initMqttOptions(deviceConfig) {
    const params = {
      productKey: deviceConfig.productKey,
      deviceName: deviceConfig.deviceName,
      timestamp: Date.now(),
      clientId: Math.random().toString(36).substr(2), //deviceConfig.productKey + "." + deviceConfig.deviceName,
    }
    //CONNECT参数
    const options = {
      keepalive: 60, //60s
      clean: true, //cleanSession不保持持久会话
      protocolVersion: 4 //MQTT v3.1.1
    }
    //1.生成clientId，username，password
    options.password = this.signHmacSha1(params, deviceConfig.deviceSecret);
    options.clientId = `${params.clientId}|securemode=2,signmethod=hmacsha1,timestamp=${params.timestamp}|`;
    options.username = `${params.deviceName}&${params.productKey}`;

    return options;
  },

  /*
    生成基于HmacSha1的password
    参考文档：https://help.aliyun.com/document_detail/73742.html?#h2-url-1
  */
  signHmacSha1(params, deviceSecret) {

    let keys = Object.keys(params).sort();
    // 按字典序排序
    keys = keys.sort();
    const list = [];
    keys.map((key) => {
      list.push(`${key}${params[key]}`);
    });
    const contentStr = list.join('');
    return crypto.hex_hmac_sha1(deviceSecret, contentStr);
  },
  sliderChangeforServo(e) {
    var value = e.detail.value;
    console.log(value);
    var msg = "{\"method\":\"thing.service.property.set\",\"id\":\"731472390\",\"params\":{\"PowerSwitch\":"+value+"},\"version\":\"1.0.0\"}";
    client.publish('/gwuiXktKj08/Y5TxmnLnuZGOiYQ8qHMI/user/update', msg);
  },
  switchChangeforMotor(e) {
    console.log(e.detail.value);
    var value = e.detail.value?1:0;
    console.log(value);
    var msg = "{\"method\":\"thing.service.property.set\",\"id\":\"731472390\",\"params\":{\"PowerSwitch\":"+value+"},\"version\":\"1.0.0\"}";
    client.publish('/gwuiXktKj08/Y5TxmnLnuZGOiYQ8qHMI/user/update', msg);
  }
})