import type { Device, TrackPoint } from "@/interface"

import hornUp from "@/assets/icons/horn/up.png"
import hornDown from "@/assets/icons/horn/down.png"
import cameraUp from "@/assets/icons/camera/up.png"
import cameraDown from "@/assets/icons/camera/down.png"
import radarUp from "@/assets/icons/radar/up.png"
import radarDown from "@/assets/icons/radar/down.png"
import unknownUp from "@/assets/icons/unknown/up.png"


export function getDeviceMarkerIcon(device: Device): string {
    switch (device.type) {
        case "horn":
            return device.functional? hornUp: hornDown;
        case "camera":
            return device.functional? cameraUp: cameraDown;
        case "radar":
            return device.functional? radarUp: radarDown;
        default:
            return unknownUp;
    }
}

export function getTrackPointMarkerContent(trackPoint: TrackPoint): string {
    return `${trackPoint.extra_info.size}, ${trackPoint.extra_info.danger}`;
}