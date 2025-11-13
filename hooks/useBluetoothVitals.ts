import { useState, useMemo, useEffect } from 'react';
import { BleManager, Device } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';

// Standard BLE Service UUIDs for health data
const HEART_RATE_SERVICE_UUID = '0000180d-0000-1000-8000-00805f9b34fb';
const HEART_RATE_CHARACTERISTIC_UUID = '00002a37-0000-1000-8000-00805f9b34fb';

export const useBluetoothVitals = () => {
  const bleManager = useMemo(() => new BleManager(), []);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [heartRate, setHeartRate] = useState<number>(0);

  useEffect(() => {
    return () => {
      bleManager.destroy();
    };
  }, [bleManager]);

  const requestBluetoothPermission = async () => {
    if (Platform.OS === 'ios') {
      return true;
    }
    if (Platform.OS === 'android' && PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION) {
      const apiLevel = parseInt(Platform.Version.toString(), 10);
      if (apiLevel < 31) {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return (
        result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
        result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
        result['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return false;
  };

  const scanForDevices = async () => {
    const isPermissionsEnabled = await requestBluetoothPermission();
    if (!isPermissionsEnabled) {
      console.log('Bluetooth permissions not granted');
      return;
    }

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log(error);
        return;
      }
      if (device && device.name) {
        setAllDevices((prevState) => {
          if (!prevState.find((d) => d.id === device.id)) {
            return [...prevState, device];
          }
          return prevState;
        });
      }
    });
  };

  const stopScan = () => {
    bleManager.stopDeviceScan();
  };

  const connectToDevice = async (device: Device) => {
    try {
      stopScan();
      const connected = await bleManager.connectToDevice(device.id);
      setConnectedDevice(connected);
      await connected.discoverAllServicesAndCharacteristics();
      
      // Start streaming data from the device
      startStreamingData(connected);

    } catch (e) {
      console.log('Failed to connect', e);
    }
  };

  const disconnectDevice = () => {
    if (connectedDevice) {
      bleManager.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);
      setHeartRate(0);
    }
  };
  
  const onHeartRateUpdate = (error: any, characteristic: any) => {
      if (error) {
          console.log(error);
          return;
      } else if (!characteristic?.value) {
          console.log('No heart rate data received');
          return;
      }

      // The heart rate data is encoded in the characteristic value
      // See the Bluetooth SIG documentation for how to parse this
      const heartRateValue = Buffer.from(characteristic.value, 'base64').readUInt8(1);
      setHeartRate(heartRateValue);
  };

  const startStreamingData = async (device: Device) => {
      if (device) {
          device.monitorCharacteristicForService(
              HEART_RATE_SERVICE_UUID,
              HEART_RATE_CHARACTERISTIC_UUID,
              onHeartRateUpdate
          );
      } else {
          console.log('No device connected');
      }
  };

  return {
    scanForDevices,
    stopScan,
    connectToDevice,
    disconnectDevice,
    allDevices,
    connectedDevice,
    heartRate,
  };
};

