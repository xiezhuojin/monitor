import "@amap/amap-jsapi-types";
import type { Device, DeviceClickedHandler, TrackLine, Zone } from "./interface";

import hornUp from "@/assets/icons/horn/up.png"
import hornDown from "@/assets/icons/horn/down.png"
import cameraUp from "@/assets/icons/camera/up.png"
import cameraDown from "@/assets/icons/camera/down.png"
import radarUp from "@/assets/icons/radar/up.png"
import radarDown from "@/assets/icons/radar/down.png"
import unknownUp from "@/assets/icons/unknown/up.png"

export class TrackLines {
    private map: AMap.Map;
    private threeDLayer: AMap.Object3DLayer;
    private labelsLayer: AMap.LabelsLayer;
    private heads: AMap.Object3D.RoundPoints;
    private lines: AMap.Object3D.MeshLine[];

    constructor(map: AMap.Map) {
        this.map = map;
        this.threeDLayer = new AMap.Object3DLayer();
        this.labelsLayer = new AMap.LabelsLayer();
        this.map.add(this.threeDLayer);
        this.map.add(this.labelsLayer);

        this.heads = new AMap.Object3D.RoundPoints();
        this.heads.geometry.vertexColors.push(1, 0, 0, 0.6);
        this.heads.geometry.pointSizes.push(6);
        this.threeDLayer.add(this.heads);
        this.lines = [];
    }

    setLabelsVisibility(visibility: boolean) {
        visibility? this.labelsLayer.show(): this.labelsLayer.hide();
    }

    showTracks(trackLines: TrackLine[]) {
        this.labelsLayer.clear();
        this.heads.geometry.length = 0;
        trackLines.forEach((trackLine, i) => {
            let position = trackLine.positions[trackLine.positions.length - 1];
            let height = trackLine.heights[trackLine.heights.length - 1];
            let coord = (this.map as any).lngLatToGeodeticCoord(position);
            this.heads.geometry.vertices.push(coord.x, coord.y, -height);
        
            if (i <= this.lines.length) {
                let line = this.lines[i];
                line.setPath(trackLine.positions);
                line.setHeight(trackLine.heights);
            } else {
                let line = new AMap.Object3D.MeshLine({
                    path: trackLine.positions,
                    height: trackLine.heights,
                    width: 1,
                    color: "#ffff00",
                })
                this.threeDLayer.add(line);
                this.lines.push(line);
            }

            let label = new AMap.LabelMarker({
                position: [position.lng, position.lat],
                text: {
                    content: `${trackLine.extra_info.size} ${trackLine.extra_info.danger}`,
                    direction: "center",
                    offset: [0, 0],
                    style: {
                        fontSize: 12,
                        strokeColor: '#fff',
                        strokeWidth: 4,
                    }
                }
            })
            this.labelsLayer.add(label);
        })
    }
}

export class Devices {
    private map: AMap.Map;
    private threeDLayer: AMap.Object3DLayer;
    private addedDevices: Map<string, Map<string, AMap.Marker>>;
    private deviceClickHandler: DeviceClickedHandler;

    constructor(map: AMap.Map, deviceClickHandler: DeviceClickedHandler) {
        this.map = map
        this.threeDLayer = new AMap.Object3DLayer();
        this.addedDevices = new Map();
        this.map.add(this.threeDLayer);

        this.deviceClickHandler = deviceClickHandler;
    }

    getDeviceIcon(device: Device) {
        switch (device.type) {
            case "horn":
                return device.extra_info.functional ? hornUp : hornDown;
            case "camera":
                return device.extra_info.functional ? cameraUp : cameraDown;
            case "radar":
                return device.extra_info.functional ? radarUp : radarDown;
            default:
                return unknownUp;
        }
    }

    addDevice(device: Device) {
        if (!(device.type in this.addedDevices.keys())) {
            this.addedDevices.set(device.type, new Map());
        }
        if (device.id in (this.addedDevices.get(device.type) as any).keys()) {
            return;
        }
        let icon = this.getDeviceIcon(device);
        let marker = new AMap.Marker({
            position: device.position,
            icon,
            label: {
                content: device.extra_info.name,
                direction: "top",
                offset: new AMap.Pixel(0, -5),
            }
        });
        this.map.add(marker);
        AMap.event.addListener(marker, "click", (event: any) => {
            this.deviceClickHandler(event, device);
        });
        this.addedDevices.get(device.type)?.set(device.id, marker);
    }

    updateDevice(device: Device) {
        let marker = this.addedDevices.get(device.type)?.get(device.id);
        marker?.setPosition([device.position.lng, device.position.lat]);
        let icon = this.getDeviceIcon(device);
        marker?.setIcon(icon);
        marker?.setLabel({
            content: device.extra_info.name,
            direction: "top",
            offset: new AMap.Pixel(0, -5),
        })
    }

    setDeviceVisibilityByType(type: string, visibility: boolean) {
        let devices = this.addedDevices.get(type);
        if (devices) {
            for (let marker of devices.values()) {
                visibility ? marker.show() : marker.hide();
            }
        }
    }
}

export class Zones {
    private threeDLayer: AMap.Object3DLayer;
    private addedZones: Map<string, Map<string, AMap.Object3D.Prism>>;

    constructor(map: AMap.Map) {
        this.threeDLayer = new AMap.Object3DLayer();
        this.addedZones = new Map();
        map.add(this.threeDLayer)
    }

    addZone(zone: Zone) {
        if (!(zone.type in this.addedZones.keys())) {
            this.addedZones.set(zone.type, new Map());
        }
        if (zone.id in (this.addedZones.get(zone.type) as any).keys()) {
            return;
        }
        let block = new AMap.Object3D.Prism({
            path: zone.path,
            height: zone.height,
            color: zone.color,
        });
        this.threeDLayer.add(block);
        this.addedZones.get(zone.type)?.set(zone.id, block);
    }

    updateZone(zone: Zone) {
        let block = this.addedZones.get(zone.type)?.get(zone.id);
        if (block) {
            block.setOptions({
                path: zone.path,
                height: zone.height,
                color: zone.color,
            })
        }
    }

    setZoneVisibilityByType(type: string, visibility: boolean) {
        let blocks = this.addedZones.get(type);
        if (blocks) {
            for (let block of blocks.values()) {
                visibility ? block.show() : block.hide();
            }
        }
    }
}

